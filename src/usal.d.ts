export interface USALDefaults {
  animation?: string;
  direction?: string;
  duration?: number;
  delay?: number;
  threshold?: number;
  splitDelay?: number;
  easing?: string;
  blur?: boolean;
}

export interface USALConfig {
  defaults?: USALDefaults;
  observersDelay?: number;
  once?: boolean;
}

export interface USALInstance {
  config(): USALConfig;
  config(newConfig: USALConfig): USALInstance;
  destroy(): Promise<void>;
  restart(): Promise<USALInstance>;
  initialized(): boolean;
  readonly version: string;
}

declare global {
  interface Window {
    USAL: USALInstance;
  }
}

declare const USAL: USALInstance;
export default USAL;
