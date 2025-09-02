import { ReactNode, ComponentProps, ElementType, ForwardRefExoticComponent, RefAttributes } from 'react';
import { USALConfig, USALInstance } from './index';

export interface AnimatedProps<T extends ElementType = 'div'> {
  children?: ReactNode;
  animation?: string;
  direction?: string;
  duration?: number;
  delay?: number;
  threshold?: number;
  once?: boolean;
  blur?: boolean;
  split?: string;
  splitDelay?: number;
  easing?: string;
  count?: string;
  text?: string;
  as?: T;
  className?: string;
  style?: React.CSSProperties;
}

export type AnimatedComponent = ForwardRefExoticComponent<
  AnimatedProps & RefAttributes<HTMLElement>
>;

export const USALProvider: React.FC<{
  children: ReactNode;
  config?: USALConfig;
}>;

export const useUSAL: (config?: USALConfig) => {
  instance: USALInstance | null;
  refresh: () => void;
};

export const Animated: AnimatedComponent;