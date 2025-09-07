import USALLib from '../usal.js';

export const USALPlugin = {
  install(app, config = {}) {
    // Configure global instance if config provided
    if (config && Object.keys(config).length > 0) {
      USALLib.config(config);
    }

    // Add global property
    app.config.globalProperties.$usal = {
      config: (c) => (c === undefined ? USALLib.config() : USALLib.config(c)),
      destroy: () => USALLib.destroy(),
      restart: () => USALLib.restart(),
    };

    // Add directive
    app.directive('usal', {
      mounted(el, binding) {
        el.setAttribute('data-usal', binding.value || 'fade');
      },
      updated(el, binding) {
        el.setAttribute('data-usal', binding.value || 'fade');
      },
      beforeMount(el, binding) {
        el.setAttribute('data-usal', binding.value || 'fade');
      },
      getSSRProps(binding) {
        return {
          'data-usal': binding?.value || 'fade',
        };
      },
    });
  },
};

export const useUSAL = () => ({
  config: (config) => {
    if (config === undefined) {
      return USALLib.config();
    }
    USALLib.config(config);
  },
  destroy: () => USALLib.destroy(),
  restart: () => USALLib.restart(),
});

export default USALLib;
