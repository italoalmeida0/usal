import { ReactiveController, ReactiveControllerHost, DirectiveResult } from 'lit';
import USAL, { USALConfig, USALInstance } from '../usal';

export class USALController implements ReactiveController {
  constructor(host: ReactiveControllerHost, config?: USALConfig);
  getInstance(): USALInstance | null;
  config(): USALConfig;
  config(config: USALConfig): void;
  destroy(): void;
  hostConnected(): void;
  hostDisconnected(): void;
}

export const useUSAL: () => {
  getInstance: () => USALInstance | null;
  config(): USALConfig;
  config(config: USALConfig): void;
  destroy: () => void;
};

export const useUSALController: (
  host: ReactiveControllerHost,
  config?: USALConfig
) => {
  getInstance: () => USALInstance | null;
  config(): USALConfig;
  config(config: USALConfig): void;
  destroy: () => void;
};

export const createUSAL: (config?: USALConfig) => {
  config(): USALConfig;
  config(config: USALConfig): void;
  destroy: () => void;
  getInstance: () => USALInstance | null;
};

export const usal: (value?: string) => DirectiveResult;

export default USAL;
