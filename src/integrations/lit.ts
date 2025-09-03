import { directive, Directive } from 'lit/directive.js';

import USALLib from '../usal.js';

// Controller for managing USAL lifecycle in Lit components
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

// Global instance for standalone usage
let globalInstance = null;

export const useUSAL = () => {
  if (!globalInstance) {
    globalInstance = USALLib.createInstance();
  }

  return {
    getInstance: () => globalInstance,
    config: (v) => globalInstance?.config(v),
    destroy: () => {
      if (globalInstance) {
        globalInstance.destroy();
        globalInstance = null;
      }
    },
  };
};

export const useUSALController = (host, config = {}) => {
  const controller = new USALController(host, config);

  return {
    getInstance: () => controller.getInstance(),
    config: (v) => controller.config(v),
    destroy: () => controller.destroy(),
  };
};

// Standalone creation
export const createUSAL = (config = {}) => {
  const instance = USALLib.createInstance();

  if (config && Object.keys(config).length > 0) {
    instance.config(config);
  }

  return {
    config: (v) => instance.config(v),
    destroy: () => instance.destroy(),
    getInstance: () => instance,
  };
};

class USALDirective extends Directive {
  render(value = 'fade') {
    return value;
  }

  update(part, [value]) {
    const element = part.element;
    element.setAttribute('data-usal', value || 'fade');
    return this.render(value);
  }
}

export const usal = directive(USALDirective);

export default USALLib;
