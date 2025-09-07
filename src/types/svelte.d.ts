import { ActionReturn } from 'svelte/action';
import USAL, { USALConfig } from '../usal';

export interface USALAction {
  (node: HTMLElement, params?: string): ActionReturn<string>;
}

export const usal: USALAction;

export const useUSAL: () => {
  config(): USALConfig;
  config(config: USALConfig): void;
  destroy: () => void;
  restart: () => void;
};

export default USAL;
