import { ref, createRef } from 'lit/directives/ref.js';
import USALLib from '../usal.js';

export class USALController {
  constructor(host, config = {}) {
    this.host = host;
    this.instance = null;
    this.initialConfig = config;
    host.addController(this);
  }

  hostConnected() {
    if (!this.instance) {
      this.instance = USALLib.createInstance();
      if (this.initialConfig && Object.keys(this.initialConfig).length > 0) {
        this.instance.config(this.initialConfig);
      }
    }
  }

  hostDisconnected() {
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }
  }

  getInstance() {
    return this.instance;
  }

  config(config) {
    if (this.instance && config) {
      this.instance.config(config);
    }
  }

  destroy() {
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }
  }
}

export const useUSAL = (host, config = {}) => {
  const controller = new USALController(host, config);
  
  return {
    getInstance: () => controller.getInstance(),
    config: (config) => controller.config(config),
    destroy: () => controller.destroy()
  };
};

export const createUSAL = (config = {}) => {
  const instance = USALLib.createInstance();
  
  if (config && Object.keys(config).length > 0) {
    instance.config(config);
  }
  
  return {
    config: (v) => instance.config(v),
    destroy: () => instance.destroy(),
    getInstance: () => instance
  };
};

export const usal = (value = 'fade') => {
  const elementRef = createRef();
  
  return ref((el) => {
    if (el) {
      el.setAttribute('data-usal', value);
      elementRef.value = el;
    }
  });
};

export default USALLib;