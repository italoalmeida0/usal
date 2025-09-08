import { ActionReturn } from 'svelte/action';
import USAL, { USALConfig, USALInstance } from '../usal';

export interface USALAction {
  (node: HTMLElement, params?: string): ActionReturn<string>;
}

export const usal: USALAction;

export const useUSAL: () => {
  config(): USALConfig;
  config(config: USALConfig): void;
  destroy: () => Promise<void>;
  restart: () => Promise<USALInstance>;
};

export default USAL;
