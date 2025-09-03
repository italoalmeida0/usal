'use client';
import { useEffect, useRef, createContext, useContext } from 'react';
import USALLib from '../usal.js';

const USALContext = createContext(null);

export const USALProvider = ({ children, config = {} }) => {
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!instanceRef.current) {
      instanceRef.current = USALLib.createInstance();
      if (Object.keys(config).length > 0) {
        instanceRef.current.config(config);
      }
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
    config: (v) => instanceRef.current?.config(v),
    destroy: () => instanceRef.current?.destroy(),
  };
};

export const createUSAL = (config = {}) => {
  const instance = USALLib.createInstance();

  if (config && Object.keys(config).length > 0) {
    instance.config(config);
  }

  return {
    config: (v) => instance.config(v),
    destroy: () => instance.destroy(),
    getInstance: () => instance,
  };
};

export default USALLib;
