export interface USALConfig {
  maxConcurrent?: number;
  duration?: number;
  delay?: number;
  threshold?: number;
  splitDelay?: number;
  once?: boolean;
}

export interface USALInstance {
  config(config?: USALConfig): void;
  destroy(): void;
  createInstance(config?: USALConfig): USALInstance;
}

declare const USAL: USALInstance & {
  createInstance(config?: USALConfig): USALInstance;
};

export default USAL;

declare global {
  interface Window {
    USAL: typeof USAL;
  }
}