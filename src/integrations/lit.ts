import { directive, Directive } from 'lit/directive.js';

import USALLib from '../usal.js';

// Controller for managing USAL in Lit components
export class USALController {
  constructor(host, config = {}) {
    this.host = host;
    this.initialConfig = config;
    host.addController(this);
  }

  hostConnected() {
    // Configure global instance if config provided
    if (this.initialConfig && Object.keys(this.initialConfig).length > 0) {
      USALLib.config(this.initialConfig);
    }
  }

  hostDisconnected() {
    // Nothing to do - global instance persists
  }

  config(config) {
    if (config === undefined) {
      return USALLib.config();
    }
    USALLib.config(config);
  }

  destroy() {
    return USALLib.destroy();
  }

  restart() {
    return USALLib.restart();
  }
}

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

export const useUSALController = (host, config = {}) => {
  const controller = new USALController(host, config);

  return {
    config: (c) => controller.config(c),
    destroy: () => controller.destroy(),
    restart: () => controller.restart(),
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
