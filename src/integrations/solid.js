import { onMount, onCleanup, createContext, useContext, createSignal } from 'solid-js';
import USALLib from '../usal.js';

const USALContext = createContext();

export const USALProvider = (props) => {
  const [instance, setInstance] = createSignal(null);

  onMount(() => {
    const inst = USALLib.createInstance();
    if (props.config) inst.config(props.config);
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
    get children() { return props.children; }
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
    config: (v) => instance() && instance().config(v),
    destroy: () => instance() && instance().destroy()
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
    getInstance: () => instance
  };
};

export default USALLib;