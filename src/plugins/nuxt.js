import { addPluginTemplate, defineNuxtModule } from '@nuxt/kit';

export default defineNuxtModule({
  setup() {
    addPluginTemplate({
      filename: 'usal-plugin.js',
      getContents: () =>
        `import USALPlugin from '@usal/vue/nuxt-plugin';export default defineNuxtPlugin((nuxtApp) => USALPlugin(nuxtApp));`,
    });
  },
});
