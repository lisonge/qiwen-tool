<script setup lang="ts">
import { NButton } from 'naive-ui';
import { ref } from 'vue';
import { delay } from './_util';

const loadingRef = ref(false);

const syncExamTime = async ({
  surveyId,
  frequency,
}: {
  surveyId: string;
  frequency: string;
}) => {
  await fetch('/exam/syncExamTime', {
    method: 'POST',
    body: `surveyId=${surveyId}&second=30&frequency=${frequency}&browser=0`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    credentials: 'same-origin',
  });
};

const answerPaper = async (
  paperHtml: HTMLElement,
  answerRecord?: Record<string, number[]>
) => {
  const data = {
    data: '',
    entity: {
      surveyId: paperHtml.querySelector('#surveyId')?.getAttribute('value')!,
      attendId: paperHtml.querySelector('#userId')?.getAttribute('value')!,
      lastCompleteDate: new Date().toJSON(),
      status: '2',
    },
    frequency: paperHtml.querySelector('#frequency')?.getAttribute('value')!,
    isSameAnswer: 1,
    surveyStatus: '1',
  };
  const usp = new URLSearchParams();
  const ql = paperHtml.querySelectorAll<HTMLDivElement>('.question');
  if (answerRecord) {
    for (let i = 0; i < 5; i++) {
      await syncExamTime({
        surveyId: data.entity.surveyId,
        frequency: data.frequency,
      });
      await delay(100);
    }
    ql.forEach((q) => {
      const questionId = q.getAttribute('questionid')!;
      const questionValue = Array.from(q.querySelectorAll('input') ?? [])
        .map((input) => input.getAttribute('value')!)
        .filter((_, i) => answerRecord[questionId].includes(i))
        .join(',');
      usp.set(questionId, questionValue);
    });
  } else {
    ql.forEach((q) => {
      const questionId = q.getAttribute('questionid')!;
      const questionValue = q.querySelector('input')?.getAttribute('value')!;
      usp.set(questionId, questionValue);
    });
  }
  data.data = usp.toString();
  await (
    await fetch('/answer/saveAnswer', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    })
  ).text();
};

const submitPaper = async () => {
  loadingRef.value = true;

  if (
    !['/answer/participate/', '/exam/participate/'].some((s) =>
      location.pathname.startsWith(s)
    )
  ) {
    loadingRef.value = false;
    console.log('不是考试页面');
    return;
  }

  const surveyId = location.pathname.split('/').at(-1);

  let paperHtml: HTMLElement;
  if (!document.querySelector('#userId')) {
    // 是考试页面,但是没有点击开始或者再考一次, 需要开始一个考试
    paperHtml = document.createElement('html');
    paperHtml.innerHTML = await (
      await fetch('/exam/participate/' + surveyId, {
        method: 'POST',
        body: 'newStart=' + surveyId,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'same-origin',
      })
    ).text();
  } else {
    paperHtml = document.body;
  }

  // 先提交试卷形成答题记录
  console.log('开始第一次答题');
  await answerPaper(paperHtml);
  console.log('第一次答题完毕');

  await delay(500);

  // 然后查询这个答题记录得到答案
  const answerHtml = document.createElement('html');
  answerHtml.innerHTML = await (
    await fetch('/exam/participate/' + surveyId, {
      credentials: 'same-origin',
    })
  ).text();
  const answerMap: Record<string, number> = {
    A: 0,
    B: 1,
    C: 2,
    D: 3,
  };
  const answerRecord: Record<string, number[]> = {};
  const ql2 = answerHtml.querySelectorAll<HTMLDivElement>('.question');
  ql2.forEach((q) => {
    const questionId = q.getAttribute('questionid')!;
    const span = q.querySelector<HTMLElement>('.true_answer')!;
    answerRecord[questionId] = span
      .textContent!.split(',')
      .map((s) => answerMap[s]);
  });

  // 新开一张试卷
  // const paperHtml = document.createElement('html');
  // paperHtml.outerHTML =
  await (
    await fetch('/exam/participate/' + surveyId, {
      method: 'POST',
      body: 'participateAgain=' + surveyId,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      credentials: 'same-origin',
    })
  ).text();

  // 使用正确答案给这张新试卷作答
  console.log('开始第二次答题');
  await answerPaper(paperHtml, answerRecord);
  console.log('第二次答题完毕');

  loadingRef.value = false;
  // 跳转满分页面
  location.pathname = '/answer/participate/' + surveyId;
};
</script>

<template>
  <div class="vue_app">
    <NButton @click="submitPaper" :loading="loadingRef"> 满分答卷 </NButton>
  </div>
</template>

<style scoped>
.vue_app {
  position: fixed;
  left: 20px;
  top: 20px;
  display: flex;
  flex-direction: column;
  z-index: 999;
  background-color: aliceblue;
  border-radius: 2px;
  padding: 10px;
}
</style>
