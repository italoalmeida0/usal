import { Component, JSX } from 'solid-js';
import USAL, { USALConfig, USALInstance } from '../usal';

export const USALProvider: Component<{
  children: JSX.Element;
  config?: USALConfig;
}>;

export const useUSAL: () => {
  getInstance: () => USALInstance | null;
  config: (config: USALConfig) => void;
  destroy: () => void;
};

export const createUSAL: (config?: USALConfig) => {
  config: (config: USALConfig) => void;
  destroy: () => void;
  getInstance: () => USALInstance | null;
};

export default USAL;
