import { App } from 'vue';
import USAL, { USALConfig, USALInstance } from '../usal';

export const USALPlugin: {
  install(app: App, config?: USALConfig): void;
};

export const useUSAL: () => {
  config(): USALConfig;
  config(config: USALConfig): void;
  destroy: () => void;
  restart: () => void;
};

declare module '@vue/runtime-core' {
  export interface GlobalProperties {
    $usal: {
      config(): USALConfig;
      config(config: USALConfig): void;
      destroy: () => void;
      restart: () => void;
    };
  }
}

export default USAL;
