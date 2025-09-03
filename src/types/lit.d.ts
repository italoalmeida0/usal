import { ReactiveController, ReactiveControllerHost } from 'lit';
import { USALConfig, USALInstance } from './index';

export class USALController implements ReactiveController {
  constructor(host: ReactiveControllerHost, config?: USALConfig);
  getInstance(): USALInstance | null;
  config(config: USALConfig): void;
  destroy(): void;
  hostConnected(): void;
  hostDisconnected(): void;
}

export const useUSAL: (host: ReactiveControllerHost, config?: USALConfig) => {
  getInstance: () => USALInstance | null;
  config: (config: USALConfig) => void;
  destroy: () => void;
};

export const createUSAL: (config?: USALConfig) => {
  config: (config: USALConfig) => void;
  destroy: () => void;
  getInstance: () => USALInstance | null;
};

export const usal: (value?: string) => import('lit/directives/ref.js').Ref<Element>;

export default USAL;