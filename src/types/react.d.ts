import { ReactNode } from 'react';
import { USALConfig, USALInstance } from '../usal';

export const USALProvider: React.FC<{
  children: ReactNode;
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
