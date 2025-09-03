import { App } from 'vue';
import { USALConfig, USALInstance } from './index';

export const createUSAL: (config?: USALConfig) => {
  install(app: App): void;
  config: (config: USALConfig) => void;
  destroy: () => void;
  getInstance: () => USALInstance | null;
};

export const useUSAL: () => {
  getInstance: () => USALInstance | null;
  config: (config: USALConfig) => void;
  destroy: () => void;
};

declare module '@vue/runtime-core' {
  export interface GlobalProperties {
    $usal: USALInstance;
  }
}

export default USAL;