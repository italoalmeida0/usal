import { ref, onMounted, onUnmounted, provide, inject, computed, defineComponent } from 'vue';
import USAL from '../usal.js';

const USAL_KEY = Symbol('usal');

export const createUSAL = (config = {}) => {
  return {
    install(app) {
      const instance = USAL.createInstance();

      app.config.globalProperties.$usal = instance;
      app.provide(USAL_KEY, instance);

      app.mixin({
        mounted() {
          if (!instance.initialized) {
            instance.init(config);
            instance.initialized = true;
          }
        }
      });

      app.directive('usal', {
        mounted(el, binding) {
          const value = typeof binding.value === 'string' 
            ? binding.value 
            : Object.entries(binding.value || {})
                .map(([key, val]) => val === true ? key : `${key}-${val}`)
                .join(' ');

          el.setAttribute('data-usal', value);
          instance.refresh();
        },
        updated(el, binding) {
          const value = typeof binding.value === 'string' 
            ? binding.value 
            : Object.entries(binding.value || {})
                .map(([key, val]) => val === true ? key : `${key}-${val}`)
                .join(' ');

          el.setAttribute('data-usal', value);
          instance.refresh();
        }
      });
    }
  };
};

export const useUSAL = (config = {}) => {
  const instance = inject(USAL_KEY) || USAL.createInstance();
  const initialized = ref(false);

  onMounted(() => {
    if (!initialized.value) {
      instance.init(config);
      initialized.value = true;
    }
  });

  onUnmounted(() => {
    if (!inject(USAL_KEY)) {
      instance.destroy();
    }
  });

  return {
    instance,
    refresh: () => instance.refresh(),
  };
};

export const Animated = defineComponent({
  name: 'Animated',
  props: {
    animation: { type: String, default: 'fade' },
    direction: String,
    duration: Number,
    delay: Number,
    threshold: Number,
    once: Boolean,
    blur: Boolean,
    split: String,
    splitDelay: Number,
    easing: String,
    count: String,
    text: String,
    as: { type: String, default: 'div' }
  },
  setup(props, { slots }) {
    const { refresh } = useUSAL();

    const dataUsal = computed(() => {
      const parts = [props.animation];

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

    return () => {
      const Component = props.as;
      return h(Component, {
        'data-usal': dataUsal.value
      }, slots.default?.());
    };
  }
});

export default USAL;