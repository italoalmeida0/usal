import { Component, JSX } from 'solid-js';
import USAL, { USALConfig } from '../usal';

export const USALProvider: Component<{
  children: JSX.Element;
  config?: USALConfig;
}>;

export const useUSAL: () => {
  config(): USALConfig;
  config(config: USALConfig): void;
  destroy: () => void;
  restart: () => void;
};

export default USAL;
