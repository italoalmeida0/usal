import { onUnmounted, inject } from 'vue';

import USALLib from '../usal.js';

const USAL_KEY = Symbol('usal');

export const createUSAL = (config = {}) => {
  const instance = USALLib.createInstance();

  if (config && Object.keys(config).length > 0) {
    instance.config(config);
  }

  return {
    install(app) {
      app.config.globalProperties.$usal = instance;
      app.provide(USAL_KEY, instance);

      app.directive('usal', {
        mounted(el, binding) {
          el.setAttribute('data-usal', binding.value || 'fade');
        },
        updated(el, binding) {
          el.setAttribute('data-usal', binding.value || 'fade');
        },
      });
    },
    config: (v) => instance.config(v),
    destroy: () => instance.destroy(),
    getInstance: () => instance,
  };
};

export const useUSAL = () => {
  const instance = inject(USAL_KEY) || USALLib.createInstance();

  onUnmounted(() => {
    if (!inject(USAL_KEY)) {
      instance.destroy();
    }
  });

  return {
    getInstance: () => instance,
    config: (v) => instance.config(v),
    destroy: () => instance.destroy(),
  };
};

export default USALLib;
