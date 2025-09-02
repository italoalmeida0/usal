import { onMount, onDestroy, createEventDispatcher } from 'svelte';
import USAL from '../usal.js';

let globalInstance = null;

export const getUSAL = () => {
  if (!globalInstance) {
    globalInstance = USAL.createInstance();
  }
  return globalInstance;
};

export const usal = (node, params = 'fade') => {
  const instance = getUSAL();

  const getValue = (p) => {
    if (typeof p === 'string') return p;

    return Object.entries(p)
      .map(([key, val]) => val === true ? key : `${key}-${val}`)
      .join(' ');
  };

  const updateAttribute = (value) => {
    node.setAttribute('data-usal', getValue(value));
    instance.refresh();
  };

  if (!instance.initialized) {
    instance.init();
    instance.initialized = true;
  }

  updateAttribute(params);

  return {
    update(newParams) {
      updateAttribute(newParams);
    },
    destroy() {

    }
  };
};

export const createUSAL = (config = {}) => {
  let instance = null;

  const init = () => {
    instance = USAL.createInstance();
    instance.init(config);
    return instance;
  };

  const destroy = () => {
    if (instance) {
      instance.destroy();
      instance = null;
    }
  };

  const refresh = () => {
    if (instance) {
      instance.refresh();
    }
  };

  return { init, destroy, refresh, getInstance: () => instance };
};

export default USAL;