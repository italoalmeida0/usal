import { Component, JSX } from 'solid-js';
import USAL, { USALConfig, USALInstance } from '../usal';

export const USALProvider: Component<{
  children: JSX.Element;
  config?: USALConfig;
}>;

export const useUSAL: () => {
  config(): USALConfig;
  config(config: USALConfig): void;
  destroy: () => Promise<void>;
  restart: () => Promise<USALInstance>;
};

export default USAL;
