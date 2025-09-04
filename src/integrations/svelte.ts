import USALLib from '../usal.js';

let globalInstance = null;

export const usal = (node, value = 'fade') => {
  if (!globalInstance) {
    globalInstance = USALLib.createInstance();
  }

  node.setAttribute('data-usal', value);

  return {
    update(newValue) {
      node.setAttribute('data-usal', newValue);
    },
    destroy() {},
  };
};

export const useUSAL = () => {
  if (!globalInstance) {
    globalInstance = USALLib.createInstance();
  }

  return {
    getInstance: () => globalInstance,
    config: (config) => {
      if (!globalInstance) return config === undefined ? null : undefined;

      if (config === undefined) {
        return globalInstance.config();
      }

      globalInstance.config(config);
    },
    destroy: () => {
      if (globalInstance) {
        globalInstance.destroy();
        globalInstance = null;
      }
    },
  };
};

export const createUSAL = (configInit = {}) => {
  let instance = USALLib.createInstance(configInit);

  const config = (config) => {
    if (!instance) return config === undefined ? null : undefined;

    if (config === undefined) {
      return instance.config();
    }

    instance.config(config);
  };

  const destroy = () => {
    if (instance) {
      instance.destroy();
      instance = null;
    }
  };

  const getInstance = () => instance;

  return { config, destroy, getInstance };
};

export default USALLib;
