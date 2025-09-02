export interface USALConfig {
  maxConcurrent?: number;
  defaultDuration?: number;
  defaultDelay?: number;
  defaultThreshold?: number;
  defaultSplitDelay?: number;
}

export interface USALInstance {
  init(config?: USALConfig): void;
  destroy(): void;
  refresh(): void;
  createInstance(): USALInstance;
}

declare const USAL: USALInstance & {
  createInstance(config?: USALConfig): USALInstance;
};

export default USAL;

declare global {
  interface Window {
    USAL: USALInstance;
  }
}