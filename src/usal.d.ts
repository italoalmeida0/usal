export interface USALConfig {
  maxConcurrent?: number;
  duration?: number;
  delay?: number;
  threshold?: number;
  splitDelay?: number;
  once?: boolean;
}

export interface USALInstance {
  config(): USALConfig;
  config(config: USALConfig): USALInstance;
  destroy(): void;
  createInstance(config?: USALConfig): USALInstance;
  readonly version?: string;
  readonly __usalInitialized?: boolean;
}

declare const USAL: USALInstance;

export default USAL;

declare global {
  interface Window {
    USAL: USALInstance;
  }
}
