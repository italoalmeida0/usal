'use client';
import { useEffect } from 'react';
import USALLib from '../usal.js';

export const USALProvider = ({ children, config = {} }) => {
  useEffect(() => {
    // Configure global instance on mount
    if (config && Object.keys(config).length > 0) {
      USALLib.config(config);
    }

    return () => {};
  }, []);

  return <>{children}</>;
};

export const useUSAL = () => {
  return {
    config: (config) => {
      if (config === undefined) {
        return USALLib.config();
      }
      USALLib.config(config);
    },
    destroy: () => USALLib.destroy(),
    restart: () => USALLib.restart(),
  };
};

export default USALLib;
