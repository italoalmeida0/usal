import { onUnmounted, inject } from 'vue';

import USALLib from '../usal.js';

const USAL_KEY = Symbol('usal');

export const createUSAL = (config = {}) => {
  const isServer = typeof window === 'undefined';

  const instance = isServer ? null : USALLib.createInstance();

  if (!isServer && instance && config && Object.keys(config).length > 0) {
    instance.config(config);
  }

  return {
    install(app) {
      const ssrSafeInstance = instance || {
        config: () => {},
        destroy: () => {},
        getInstance: () => null,
      };

      app.config.globalProperties.$usal = ssrSafeInstance;
      app.provide(USAL_KEY, ssrSafeInstance);

      app.directive('usal', {
        mounted(el, binding) {
          if (typeof window !== 'undefined') {
            el.setAttribute('data-usal', binding.value || 'fade');
          }
        },
        updated(el, binding) {
          if (typeof window !== 'undefined') {
            el.setAttribute('data-usal', binding.value || 'fade');
          }
        },
        beforeMount(el, binding) {
          if (typeof window !== 'undefined') {
            el.setAttribute('data-usal', binding.value || 'fade');
          }
        },
        getSSRProps(binding) {
          if (!binding) {
            return { 'data-usal': 'fade' };
          }
          return {
            'data-usal': binding.value || 'fade',
          };
        },
      });
    },
    config: (v) => instance?.config(v) || (() => {}),
    destroy: () => instance?.destroy() || (() => {}),
    getInstance: () => instance,
  };
};

export const useUSAL = () => {
  if (typeof window === 'undefined') {
    return {
      getInstance: () => null,
      config: () => {},
      destroy: () => {},
    };
  }

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
