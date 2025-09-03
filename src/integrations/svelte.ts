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
    config: (v) => globalInstance && globalInstance.config(v),
    destroy: () => {
      if (globalInstance) {
        globalInstance.destroy();
        globalInstance = null;
      }
    },
  };
};

export const createUSAL = (configInit = {}) => {
  let instance = USALLib.createInstance();

  if (configInit && Object.keys(configInit).length > 0) {
    instance.config(configInit);
  }

  const config = (v) => {
    if (instance && Object.keys(v).length > 0) {
      instance.config(v);
    }
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
