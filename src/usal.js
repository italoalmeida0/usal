const USAL = (() => {
  if (typeof window !== 'undefined' && window.USAL && window.USAL.__usalInitialized) {
    return window.USAL;
  }

  // Handle server-side rendering
  if (typeof window === 'undefined') {
    const noop = () => ({ config: noop, destroy: noop });
    return {
      config: noop,
      destroy: noop,
      createInstance: () => ({ config: noop, destroy: noop }),
    };
  }

  // Config array indices
  const ANIMATION = 0;
  const DIRECTION = 1;
  const DURATION = 2;
  const DELAY = 3;
  const THRESHOLD = 4;
  const SPLIT_DELAY = 5;
  const EASING = 6;
  const BLUR = 7;
  const ONCE = 8;
  const SPLIT = 9;
  const SPLIT_ANIMATION = 10;
  const COUNT = 11;
  const TEXT = 12;

  const animationMap = { fade: 0, zoomin: 1, zoomout: 2, flip: 3 };

  // Bitwise flags for directions
  const DIRECTION_UP = 1;
  const DIRECTION_DOWN = 2;
  const DIRECTION_LEFT = 4;
  const DIRECTION_RIGHT = 8;

  const defaults = {
    maxConcurrent: 100,
    duration: 1000,
    delay: 0,
    threshold: 30,
    splitDelay: 30,
    once: false,
  };

  // Utility to apply styles - now filters out null/undefined
  const $ = (element, styles) => {
    for (const key in styles) {
      if (styles[key] != null) element.style[key] = styles[key];
    }
  };

  const parseClasses = (str) => {
    const tokens = str.trim().split(/\s+/);
    const config = [0, 0, null, null, null, null, 0, 0, null, null, null, null, null];

    tokens.forEach((token) => {
      const parts = token.split('-');
      const first = parts[0];

      if (animationMap[first] !== undefined) {
        config[ANIMATION] = animationMap[first];
        if (parts[1]) {
          let dir = 0;
          for (const char of parts[1]) {
            dir |=
              char === 'u'
                ? DIRECTION_UP
                : char === 'd'
                  ? DIRECTION_DOWN
                  : char === 'l'
                    ? DIRECTION_LEFT
                    : char === 'r'
                      ? DIRECTION_RIGHT
                      : 0;
          }
          config[DIRECTION] = dir;
        }
      } else if (first === 'split') {
        const second = parts[1];
        if (['word', 'letter', 'item'].includes(second)) {
          config[SPLIT] = second;
        } else if (second === 'delay' && parts[2]) {
          config[SPLIT_DELAY] = +parts[2];
        } else {
          config[SPLIT_ANIMATION] = token.substring(6);
        }
      } else if (first === 'text' && ['shimmer', 'fluid'].includes(parts[1])) {
        config[TEXT] = parts[1];
      } else if (token.startsWith('count-[') && token.endsWith(']')) {
        config[COUNT] = token.slice(7, -1);
      } else if (parts[1] && !isNaN(+parts[1])) {
        const value = +parts[1];
        if (first === 'duration') config[DURATION] = value;
        else if (first === 'delay') config[DELAY] = value;
        else if (first === 'threshold') config[THRESHOLD] = value;
      } else if (token === 'blur') {
        config[BLUR] = 1;
      } else if (token === 'once') {
        config[ONCE] = true;
      } else if (token === 'linear') {
        config[EASING] = 1;
      } else if (token === 'ease') {
        config[EASING] = 2;
      } else if (token === 'ease-in') {
        config[EASING] = 3;
      }
    });

    return config;
  };

  // Easing functions
  const easings = [
    (t) => 1 - Math.pow(1 - t, 3), // ease-out
    (t) => t, // linear
    (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), // ease
    (t) => t * t * t, // ease-in
  ];

  // Transform generators
  const transformFns = {
    1: (p) => `scale(${0.6 + p * 0.4})`, // zoomin
    2: (p) => `scale(${1.2 - p * 0.2})`, // zoomout
  };

  const getTransform = (animation, direction, progress) => {
    const inverse = 1 - progress;
    let transform = transformFns[animation]?.(progress) || '';

    if (animation === 3) {
      // flip
      const value =
        inverse *
        (direction &&
        direction !== DIRECTION_UP &&
        direction !== DIRECTION_DOWN &&
        direction !== DIRECTION_LEFT &&
        direction !== DIRECTION_RIGHT
          ? 45
          : 90);
      const parts = [];
      if (direction & (DIRECTION_UP | DIRECTION_DOWN))
        parts.push(`rotateX(${direction & DIRECTION_UP ? value : -value}deg)`);
      if (direction & (DIRECTION_LEFT | DIRECTION_RIGHT))
        parts.push(`rotateY(${direction & DIRECTION_LEFT ? -value : value}deg)`);
      if (!parts.length) parts.push(`rotateY(${inverse * 90}deg)`);
      transform = `perspective(400px) ${parts.join(' ')}`;
    }

    if (animation !== 3 && direction) {
      const val = inverse * 30;
      const x = direction & DIRECTION_RIGHT ? -val : direction & DIRECTION_LEFT ? val : 0;
      const y = direction & DIRECTION_DOWN ? -val : direction & DIRECTION_UP ? val : 0;
      if (x || y) transform += ` translate(${x}px, ${y}px)`;
    }

    return transform || 'none';
  };

  const setupCount = (element, config, data) => {
    const text = element.textContent || '';
    const parts = text.split(config[COUNT]);
    if (parts.length !== 2) return false;

    const clean = config[COUNT].replace(/[^\d\s,.]/g, '');
    let decimals = 0,
      value = 0;

    const nums = clean.replace(/[^\d.]/g, '.');
    const lastDot = nums.lastIndexOf('.');
    if (lastDot > -1) {
      const after = nums.substring(lastDot + 1);
      if (after.length <= 2) {
        decimals = after.length;
        value = parseFloat(nums);
      } else {
        value = parseFloat(nums.replace(/\./g, ''));
      }
    } else {
      value = parseFloat(clean.replace(/\D/g, ''));
    }

    const span = document.createElement('span');
    span.textContent = '0';
    span.style.cssText = 'display:inline;visibility:visible';

    element.innerHTML = '';
    element.appendChild(document.createTextNode(parts[0]));
    element.appendChild(span);
    element.appendChild(document.createTextNode(parts[1]));

    data.countData = [value, decimals, config[COUNT]];
    data.countSpan = span;
    return true;
  };

  const formatNumber = (value, original, decimals) => {
    let formatted = decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toString();
    if (original.includes(' ') || original.includes(',')) {
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, original.includes(' ') ? ' ' : ',');
      formatted = parts.join(decimals > 0 ? '.' : '');
    }
    return formatted;
  };

  // Unified split function
  const setupSplit = (element, config) => {
    const targets = [];
    const opacity = config[TEXT] ? '1' : '0';

    if (config[SPLIT] === 'item') {
      Array.from(element.children).forEach((child) => {
        child.style.opacity = opacity;
        targets.push(child);
      });
    } else {
      const text = element.textContent || '';
      const parts = config[SPLIT] === 'word' ? text.split(/(\s+)/) : text.split('');
      element.innerHTML = '';

      parts.forEach((part) => {
        if (!part) return;
        if (/\s/.test(part)) {
          element.appendChild(document.createTextNode(part));
        } else {
          const span = document.createElement('span');
          span.textContent = part;
          span.style.cssText = `display:inline-block;opacity:${opacity}`;
          element.appendChild(span);
          targets.push(span);
        }
      });
    }
    return targets;
  };

  const processElement = (element, instance) => {
    let id = element.getAttribute('data-usal-id');
    if (!id) {
      id = `u${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
      element.setAttribute('data-usal-id', id);
    }

    // Cancel existing animation
    const existing = instance.elements.get(id);
    if (existing?.rafId) {
      cancelAnimationFrame(existing.rafId);
      instance.animating.delete(element);
    }

    const classes = element.getAttribute('data-usal') || '';
    const config = parseClasses(classes);

    const data = {
      element,
      config,
      configString: classes,
      original: {
        opacity: element.style.opacity || '',
        transform: element.style.transform || '',
        filter: element.style.filter || '',
      },
      targets: null,
      animated: 0,
      rafId: null,
    };

    if (config[COUNT]) setupCount(element, config, data);
    if (config[SPLIT]) {
      data.targets = setupSplit(element, config);
      if (config[SPLIT_ANIMATION]) data.splitConfig = parseClasses(config[SPLIT_ANIMATION]);
    }

    if (!config[TEXT] && !data.countSpan && !data.targets) {
      element.style.opacity = '0';
    }

    instance.elements.set(id, data);
    return data;
  };

  // Unified text effect function
  const animateText = (targets, type, duration) => {
    const startTime = performance.now();
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const cycle = (elapsed % duration) / duration;

      targets.forEach((target, i) => {
        if (type === 'shimmer') {
          const phase = cycle * Math.PI * 2 + i * 0.5;
          const intensity = Math.sin(phase) * 0.5 + 0.5;
          $(target, {
            opacity: 0.5 + intensity * 0.5,
            filter: `brightness(${1 + intensity * 0.3})`,
          });
        } else {
          const wave = cycle * 1.6 - 0.3;
          const dist = Math.abs(wave - i / targets.length);
          const intensity = dist < 0.3 ? 1 - dist / 0.3 : 0;
          $(target, {
            fontWeight: Math.round(100 + intensity * 800).toString(),
            opacity: '1',
          });
        }
      });
      return requestAnimationFrame(animate);
    };
    return animate();
  };

  const animate = (ratio, data, instance) => {
    const threshold = Math.max(
      0,
      Math.min(1, (data.config[THRESHOLD] ?? instance.config.threshold) / 100)
    );

    if (
      data.animated ||
      ratio < threshold ||
      instance.animating.has(data.element) ||
      instance.animating.size >= instance.config.maxConcurrent
    )
      return;

    instance.animating.add(data.element);

    const { config, element, targets, countSpan, countData } = data;

    // Text animation effects
    if (config[TEXT]) {
      data.rafId = animateText(
        targets || [element],
        config[TEXT],
        config[DURATION] ?? instance.config.duration
      );
      data.animated = 1;
      return;
    }

    // Initial state
    if (!countSpan && !targets) {
      const transform = getTransform(config[ANIMATION], config[DIRECTION], 0);
      $(element, {
        opacity: '0',
        transform: transform !== 'none' ? transform : 'translateZ(0)',
        filter: config[BLUR] ? 'blur(10px)' : null,
        willChange: 'transform,opacity',
      });
    }

    const start = performance.now() + (config[DELAY] ?? instance.config.delay);
    const easing = easings[config[EASING]];
    const splitConfig = data.splitConfig || config;

    // Main animation loop
    const tick = () => {
      const elapsed = Math.max(0, performance.now() - start);
      const progress = Math.min(elapsed / (config[DURATION] ?? instance.config.duration), 1);
      const eased = easing(progress);

      if (countSpan && countData) {
        countSpan.textContent =
          progress >= 1
            ? countData[2]
            : formatNumber(countData[0] * eased, countData[2], countData[1]);
      }

      const applyAnimation = (el, animProgress, animConfig) => {
        const transform = getTransform(animConfig[ANIMATION], animConfig[DIRECTION], animProgress);
        $(el, {
          opacity: animProgress.toString(),
          transform: transform !== 'none' ? transform : 'translateZ(0)',
          filter: config[BLUR] && animProgress < 1 ? `blur(${(1 - animProgress) * 10}px)` : null,
          willChange: animProgress < 1 ? 'transform,opacity' : 'auto',
        });
      };

      if (targets) {
        let done = true;
        targets.forEach((target, index) => {
          const targetDelay = index * (config[SPLIT_DELAY] ?? instance.config.splitDelay);
          const targetElapsed = elapsed - targetDelay;
          if (targetElapsed < 0) {
            done = false;
            return;
          }
          const targetProgress = Math.min(
            targetElapsed / (config[DURATION] ?? instance.config.duration),
            1
          );
          applyAnimation(target, easing(targetProgress), splitConfig);
          if (targetProgress < 1) done = false;
        });

        if (!done) {
          data.rafId = requestAnimationFrame(tick);
        } else {
          instance.animating.delete(element);
          data.animated = 1;
        }
      } else {
        applyAnimation(element, eased, config);
        if (progress < 1) {
          data.rafId = requestAnimationFrame(tick);
        } else {
          instance.animating.delete(element);
          data.animated = 1;
        }
      }
    };
    data.rafId = requestAnimationFrame(tick);
  };

  const reset = (data, instance) => {
    if (data.rafId) {
      cancelAnimationFrame(data.rafId);
      data.rafId = null;
    }

    const { element, targets, countSpan, original, config } = data;

    // Reset styles
    const resetStyles = { opacity: '0', transform: '', filter: '' };

    if (!config[TEXT] && !countSpan && !targets) {
      $(element, resetStyles);
    } else {
      $(element, original);
    }

    if (countSpan) countSpan.textContent = '0';
    if (targets) targets.forEach((target) => $(target, resetStyles));

    if (!(config[ONCE] ?? instance.config.once)) data.animated = 0;
    instance.animating.delete(element);
  };

  const handleElement = (element, instance, action = 'add') => {
    const id = element.getAttribute('data-usal-id');

    if (action === 'remove') {
      if (!id) return;
      const data = instance.elements.get(id);
      if (!data) return;
      if (data.rafId) cancelAnimationFrame(data.rafId);
      if (instance.observer) instance.observer.unobserve(element);
      instance.elements.delete(id);
      instance.animating.delete(element);
      return;
    }

    if (action === 'update') {
      const newClasses = element.getAttribute('data-usal');
      if (!newClasses) {
        handleElement(element, instance, 'remove');
        return;
      }
      if (id && instance.elements.has(id)) {
        const data = instance.elements.get(id);
        if (newClasses !== data.configString) {
          reset(data, instance);
          instance.elements.delete(id);
          element.removeAttribute('data-usal-id');
          newElement(element, instance);
        }
      } else {
        handleElement(element, instance, 'add');
      }
      return;
    }

    if (id && instance.elements.has(id)) return;
    newElement(element, instance);
  };

  const newElement = (element, instance) => {
    const data = processElement(element, instance);
    if (instance.observer) {
      instance.observer.observe(element);
      const rect = element.getBoundingClientRect();
      const visible =
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0;

      if (visible) {
        const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
        const visibleWidth = Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0);
        const ratio = (visibleHeight * visibleWidth) / (rect.height * rect.width);
        animate(ratio, data, instance);
      }
    }
  };

  const setupObservers = (instance) => {
    // Disconnect any previous observers
    if (instance.observer) instance.observer.disconnect();
    instance.mutationObservers?.forEach((obs) => obs.disconnect());
    instance.mutationObservers = new Map(); // Use the plural version

    // IntersectionObserver for viewport visibility
    instance.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const data = instance.elements.get(entry.target.getAttribute('data-usal-id'));
          if (!data) return;

          if (
            entry.intersectionRatio === 0 &&
            data.animated &&
            !(data.config[ONCE] ?? instance.config.once) &&
            !instance.animating.has(data.element)
          ) {
            reset(data, instance);
          } else {
            animate(entry.intersectionRatio, data, instance);
          }
        });
      },
      { threshold: Array.from({ length: 11 }, (_, i) => i / 10) }
    );

    // Re-observe all known elements
    instance.elements.forEach((data) => instance.observer.observe(data.element));

    // Start the new, robust observation process
    walkAndObserveRoots(document.body, instance);
  };

  const walkAndObserveRoots = (root, instance) => {
    // 1. Process elements in the current root
    const processRoot = (currentRoot) => {
      if (currentRoot.hasAttribute?.('data-usal')) {
        handleElement(currentRoot, instance);
      }
      currentRoot.querySelectorAll?.('[data-usal]').forEach((el) => handleElement(el, instance));
    };

    processRoot(root);

    // 2. Set up a dedicated MutationObserver for this root
    if (!instance.mutationObservers.has(root)) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) {
                processRoot(node); // Process the new node and its children
                if (node.shadowRoot) {
                  walkAndObserveRoots(node.shadowRoot, instance); // Recursively observe new shadow roots
                }
                node.querySelectorAll?.('*').forEach((el) => {
                  if (el.shadowRoot) walkAndObserveRoots(el.shadowRoot, instance);
                });
              }
            });
            mutation.removedNodes.forEach((node) => {
              if (node.nodeType === 1) {
                if (node.hasAttribute?.('data-usal')) handleElement(node, instance, 'remove');
                node
                  .querySelectorAll?.('[data-usal]')
                  .forEach((el) => handleElement(el, instance, 'remove'));
              }
            });
          } else if (mutation.type === 'attributes' && mutation.attributeName === 'data-usal') {
            handleElement(mutation.target, instance, 'update');
          }
        });
      });

      observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-usal'],
      });
      instance.mutationObservers.set(root, observer);
    }

    // 3. Find and recurse into any existing shadow roots
    root.querySelectorAll('*').forEach((el) => {
      if (el.shadowRoot) {
        walkAndObserveRoots(el.shadowRoot, instance);
      }
    });
  };

  const createInstance = (config = {}) => {
    let destroyTimeout;
    const instance = {
      initialized: false,
      observer: null,
      mutationObservers: null,
      elements: new Map(),
      animating: new Set(),
      config: { ...defaults, ...config },
    };

    const autoInit = () => {
      if (!instance.initialized) {
        instance.initialized = true;
        setupObservers(instance);
      }
    };

    if (typeof window !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
      } else {
        requestAnimationFrame(autoInit);
      }
    }

    return {
      config(newConfig = {}) {
        if (arguments.length === 0) {
          return { ...instance.config };
        }
        Object.assign(instance.config, newConfig);
        return this;
      },

      destroy() {
        clearTimeout(destroyTimeout);
        destroyTimeout = setTimeout(() => {
          instance.observer?.disconnect();
          instance.mutationObservers?.forEach((obs) => obs.disconnect());
          instance.elements.forEach((data) => {
            if (data.rafId) cancelAnimationFrame(data.rafId);
            if (data.element?.parentNode) {
              $(data.element, data.original);
              data.element.removeAttribute('data-usal-id');
            }
          });
          instance.elements.clear();
          instance.animating.clear();
          instance.initialized = false;
          instance.observer = null;
          instance.mutationObservers = null;
        }, 0);
      },

      createInstance: (newConfig) => createInstance(newConfig),
    };
  };

  const globalInstance = createInstance();
  const usalWithFlag = {
    ...globalInstance,
    createInstance,
    __usalInitialized: true,
    version: '{%%VERSION%%}',
  };

  return usalWithFlag;
})();

if (typeof window !== 'undefined') {
  if (!window.USAL || !window.USAL.__usalInitialized) {
    window.USAL = USAL;
  }
}

export default USAL;
