import { createUSAL } from '@usal/vue';
export default (nuxtApp) => {
  const usal = createUSAL();
  nuxtApp.vueApp.use(usal);
};
