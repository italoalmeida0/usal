import { onMount, onCleanup, createContext, useContext, createSignal } from 'solid-js';

import USALLib from '../usal.js';

const USALContext = createContext();

export const USALProvider = (props) => {
  const [instance, setInstance] = createSignal(null);

  onMount(() => {
    const inst = USALLib.createInstance(props.config || {});
    setInstance(inst);
  });

  onCleanup(() => {
    const inst = instance();
    if (inst) {
      inst.destroy();
    }
  });

  return USALContext.Provider({
    value: instance,
    get children() {
      return props.children;
    },
  });
};

export const useUSAL = () => {
  const contextInstance = useContext(USALContext);
  const [instance, setInstance] = createSignal(null);

  onMount(() => {
    if (contextInstance && contextInstance()) {
      setInstance(contextInstance());
    } else {
      const inst = USALLib.createInstance();
      setInstance(inst);
    }
  });

  onCleanup(() => {
    if (!contextInstance && instance()) {
      instance().destroy();
    }
  });

  return {
    getInstance: () => instance(),
    config: (config) => {
      const inst = instance();
      if (!inst) return config === undefined ? null : undefined;

      if (config === undefined) {
        return inst.config();
      }

      inst.config(config);
    },
    destroy: () => instance() && instance().destroy(),
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
