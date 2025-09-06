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
      this.instance = USALLib.createInstance(this.initialConfig);
    }
  }

  hostDisconnected() {
    // Delegate to the destroy method to avoid code duplication
    this.destroy();
  }

  getInstance() {
    return this.instance;
  }

  config(config) {
    if (!this.instance) return config === undefined ? null : undefined;

    if (config === undefined) {
      return this.instance.config();
    }

    this.instance.config(config);
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
    config: (config) => {
      if (config === undefined) {
        return globalInstance?.config();
      }
      globalInstance?.config(config);
    },
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
    config: (config) => {
      if (config === undefined) {
        return controller.config();
      }
      controller.config(config);
    },
    destroy: () => controller.destroy(),
  };
};

// Standalone creation
export const createUSAL = (config = {}) => {
  const instance = USALLib.createInstance(config);

  return {
    config: (config) => {
      if (config === undefined) {
        return instance.config();
      }
      instance.config(config);
    },
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
