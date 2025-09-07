import USALLib from '../usal.js';

export const usal = (node, value = 'fade') => {
  node.setAttribute('data-usal', value);

  return {
    update(newValue) {
      node.setAttribute('data-usal', newValue);
    },
    destroy() {},
  };
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
