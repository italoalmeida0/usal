import { ReactiveController, ReactiveControllerHost, DirectiveResult } from 'lit';
import USAL, { USALConfig } from '../usal';

export class USALController implements ReactiveController {
  constructor(host: ReactiveControllerHost, config?: USALConfig);
  config(): USALConfig;
  config(config: USALConfig): void;
  destroy(): void;
  restart(): void;
  hostConnected(): void;
  hostDisconnected(): void;
}

export const useUSAL: () => {
  config(): USALConfig;
  config(config: USALConfig): void;
  destroy: () => void;
  restart: () => void;
};

export const useUSALController: (
  host: ReactiveControllerHost,
  config?: USALConfig
) => USALController;

export const usal: (value?: string) => DirectiveResult;

export default USAL;
