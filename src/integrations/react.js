import { useEffect, useRef, createContext, useContext, forwardRef } from 'react';
import USAL from '../usal.js';

const USALContext = createContext(null);

export const USALProvider = ({ children, config = {} }) => {
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!instanceRef.current) {
      instanceRef.current = USAL.createInstance();
      instanceRef.current.init(config);
    }

    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
      }
    };
  }, []);

  return (
    <USALContext.Provider value={instanceRef.current}>
      {children}
    </USALContext.Provider>
  );
};

export const useUSAL = (config = {}) => {
  const contextInstance = useContext(USALContext);
  const instanceRef = useRef(null);

  useEffect(() => {
    const instance = contextInstance || USAL.createInstance();

    if (!instanceRef.current) {
      instanceRef.current = instance;
      if (!contextInstance) {
        instance.init(config);
      }
    }

    return () => {
      if (!contextInstance && instanceRef.current) {
        instanceRef.current.destroy();
      }
    };
  }, [contextInstance]);

  return {
    instance: instanceRef.current,
    refresh: () => instanceRef.current?.refresh(),
  };
};

export const Animated = forwardRef(({ 
  children, 
  animation = "fade",
  duration,
  delay,
  threshold,
  once = false,
  blur = false,
  split,
  splitDelay,
  direction,
  easing,
  count,
  text,
  className = "",
  style = {},
  as: Component = "div",
  ...props 
}, ref) => {
  const { refresh } = useUSAL();

  const usualParts = [animation];

  if (direction) usualParts[0] += `-${direction}`;
  if (duration) usualParts.push(`duration-${duration}`);
  if (delay) usualParts.push(`delay-${delay}`);
  if (threshold) usualParts.push(`threshold-${threshold}`);
  if (once) usualParts.push('once');
  if (blur) usualParts.push('blur');
  if (easing) usualParts.push(easing);
  if (split) usualParts.push(`split-${split}`);
  if (splitDelay) usualParts.push(`split-delay-${splitDelay}`);
  if (count) usualParts.push(`count-[${count}]`);
  if (text) usualParts.push(`text-${text}`);

  const dataUsal = usualParts.join(' ');

  useEffect(() => {

    refresh();
  }, [dataUsal, refresh]);

  return (
    <Component
      ref={ref}
      data-usal={dataUsal}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Component>
  );
});

Animated.displayName = 'Animated';

export default USAL;