import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import monkeyPlugin from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    monkeyPlugin({
      entry: 'src/main.ts',
      userscript: {
        name: '奇问辅助工具',
        namespace: 'https://dev.songe.li',
        icon: 'https://dev.songe.li/favicon.svg',
        description: '奇问辅助工具',
        updateURL:
          'https://cdn.jsdelivr.net/gh/lisonge/qiwen-tool@main/dist/qiwen-tool.user.js',
        include: [
          'http://qiwen.qiyi.domain/answer/participate/*',
          'http://qiwen.qiyi.domain/exam/participate/*',
        ],
        require: [
          // polyfill all
          'https://cdn.jsdelivr.net/npm/core-js-bundle@latest/minified.js',
        ],
      },
      build: {
        externalGlobals: {
          vue: [
            'Vue',
            (version) =>
              `https://cdn.jsdelivr.net/npm/vue@${version}/dist/vue.global.prod.js`,
          ],
        },
      },
    }),
  ],
  build: {
    minify: true,
  },
});
