import React, { ReactNode } from 'react';
import USAL, { USALConfig, USALInstance } from '../usal';

export const USALProvider: React.FC<{
  children: ReactNode;
  config?: USALConfig;
}>;

export const useUSAL: () => {
  config(): USALConfig;
  config(config: USALConfig): void;
  destroy: () => void;
  restart: () => void;
};

export default USAL;
