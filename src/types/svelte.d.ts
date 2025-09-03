import { ActionReturn } from 'svelte/action';
import USAL, { USALConfig, USALInstance } from '../usal';

export interface USALAction {
  (node: HTMLElement, params?: string): ActionReturn<string>;
}

export const usal: USALAction;

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
