import { onMount, onCleanup, createContext, useContext, createSignal, createMemo } from 'solid-js';
import USAL from '../usal.js';

const USALContext = createContext();

export const USALProvider = (props) => {
  let instance = null;

  onMount(() => {
    instance = USAL.createInstance();
    instance.init(props.config || {});
  });

  onCleanup(() => {
    if (instance) {
      instance.destroy();
    }
  });

  return USALContext.Provider({
    value: instance,
    get children() {
      return props.children;
    }
  });
};

export const useUSAL = (config = {}) => {
  const contextInstance = useContext(USALContext);
  let instance = null;

  onMount(() => {
    if (contextInstance) {
      instance = contextInstance;
    } else {
      instance = USAL.createInstance();
      instance.init(config);
    }
  });

  onCleanup(() => {
    if (!contextInstance && instance) {
      instance.destroy();
    }
  });

  return {
    getInstance: () => instance,
    refresh: () => instance?.refresh(),
  };
};

export const Animated = (props) => {
  const { refresh } = useUSAL();

  const dataUsal = createMemo(() => {
    const parts = [props.animation || 'fade'];

    if (props.direction) parts[0] += `-${props.direction}`;
    if (props.duration) parts.push(`duration-${props.duration}`);
    if (props.delay) parts.push(`delay-${props.delay}`);
    if (props.threshold) parts.push(`threshold-${props.threshold}`);
    if (props.once) parts.push('once');
    if (props.blur) parts.push('blur');
    if (props.easing) parts.push(props.easing);
    if (props.split) parts.push(`split-${props.split}`);
    if (props.splitDelay) parts.push(`split-delay-${props.splitDelay}`);
    if (props.count) parts.push(`count-[${props.count}]`);
    if (props.text) parts.push(`text-${props.text}`);

    return parts.join(' ');
  });

  onMount(() => {
    refresh();
  });

  const Component = props.as || 'div';

  return Component({
    'data-usal': dataUsal(),
    class: props.class,
    style: props.style,
    ...props.otherProps,
    children: props.children
  });
};

export default USAL;