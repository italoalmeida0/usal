'use client';
import { useEffect, useRef, createContext, useContext } from 'react';
import USALLib from '../usal.js';

const USALContext = createContext(null);

export const USALProvider = ({ children, config = {} }) => {
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!instanceRef.current) {
      instanceRef.current = USALLib.createInstance(config);
    }

    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
      }
    };
  }, []);

  return <USALContext.Provider value={instanceRef.current}>{children}</USALContext.Provider>;
};

export const useUSAL = () => {
  const contextInstance = useContext(USALContext);
  const instanceRef = useRef(null);

  useEffect(() => {
    const instance = contextInstance || USALLib.createInstance();

    if (!instanceRef.current) {
      instanceRef.current = instance;
    }

    return () => {
      if (!contextInstance && instanceRef.current) {
        instanceRef.current.destroy();
      }
    };
  }, [contextInstance]);

  return {
    getInstance: () => instanceRef.current,
    config: (config) => {
      if (config === undefined) {
        return instanceRef.current?.config();
      }
      instanceRef.current?.config(config);
    },
    destroy: () => instanceRef.current?.destroy(),
  };
};

export const createUSAL = (config = {}) => {
  const instance = USALLib.createInstance(config);

  return {
    config: (config) => {
      if (config === undefined) {
        return instance.config();
      }
      instance.config(config);
    },
    destroy: () => instance.destroy(),
    getInstance: () => instance,
  };
};

export default USALLib;
