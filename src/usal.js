const USAL = (() => {
  const EMPTY_STR = '';
  const SPACE_STR = ' ';
  const NONE_STR = 'none';
  const DOT_STR = '.';
  const SPAN_STR = 'span';
  const ASTERISK_STR = '*';

  if (typeof window !== 'undefined' && window.USAL && window.USAL.__usalInitialized) {
    return window.USAL;
  }

  // Handle server-side rendering
  const noop = () => ({ config: noop, destroy: noop });
  if (typeof window === 'undefined') {
    return {
      config: noop,
      destroy: noop,
      createInstance: () => ({ config: noop, destroy: noop }),
    };
  }

  const DATA_USAL = 'data-usal';
  const DATA_USAL_ID = DATA_USAL + '-id';
  const DATA_USAL_FRAGMENT = DATA_USAL + '-fragment';
  const DATA_USAL_SELECTOR = '[' + DATA_USAL + ']';

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

  const INTERSECTION_THRESHOLDS = Array.from({ length: 11 }, (_, i) => i / 10);

  const animationMap = ['fade', 'zoomin', 'zoomout', 'flip'];

  // Bitwise flags for directions
  const DIRECTION_UP = 1;
  const DIRECTION_DOWN = 2;
  const DIRECTION_LEFT = 4;
  const DIRECTION_RIGHT = 8;

  // State constants
  const IDLE = 0;
  const ANIMATING = 1;
  const COMPLETED = 2;

  const THROTTLE_DELAY = 50;

  const defaults = {
    duration: 1000,
    delay: 0,
    threshold: 30,
    splitDelay: 30,
    once: false,
  };

  // Utility to apply styles
  const $ = (element, styles, clean = false) => {
    for (const key in styles) {
      if (styles[key] != null) element.style[key] = styles[key];
    }

    clean
      ? element.removeAttribute(DATA_USAL_FRAGMENT)
      : element.setAttribute(DATA_USAL_FRAGMENT, EMPTY_STR);
  };

  const parseClasses = (str) => {
    const tokens = str.trim().split(/\s+/);
    const config = [0, 0, null, null, null, null, 0, 0, null, null, null, null, null];

    tokens.forEach((token) => {
      const parts = token.split('-');
      const first = parts[0];

      if (animationMap.indexOf(first) !== -1) {
        config[ANIMATION] = animationMap.indexOf(first);
        if (parts[1]) {
          let dir = 0;
          for (const char of parts[1]) {
            switch (char) {
              case 'u':
                dir |= DIRECTION_UP;
                break;
              case 'd':
                dir |= DIRECTION_DOWN;
                break;
              case 'l':
                dir |= DIRECTION_LEFT;
                break;
              case 'r':
                dir |= DIRECTION_RIGHT;
                break;
            }
          }
          config[DIRECTION] = dir;
        }
        return;
      }

      let numberIndex = null;
      switch (token) {
        case 'blur':
          config[BLUR] = 1;
          break;
        case 'once':
          config[ONCE] = true;
          break;
        case 'linear':
          config[EASING] = 1;
          break;
        case 'ease':
          config[EASING] = 2;
          break;
        case 'ease-in':
          config[EASING] = 3;
          break;

        default:
          switch (first) {
            case 'count':
              if (parts[1]?.startsWith('[') && token.endsWith(']'))
                config[COUNT] = token.slice(7, -1);
              break;

            case 'split':
              if (!parts[1]) break;
              switch (parts[1]) {
                case 'word':
                case 'letter':
                case 'item':
                  config[SPLIT] = parts[1];
                  break;
                case 'delay':
                  if (parts[2]) config[SPLIT_DELAY] = +parts[2];
                  break;
                default:
                  if (parts[1]) config[SPLIT_ANIMATION] = token.substring(6);
              }
              break;

            case 'text':
              switch (parts[1]) {
                case 'shimmer':
                case 'fluid':
                  config[TEXT] = parts[1];
                  break;
              }
              break;

            case 'duration':
              numberIndex = DURATION;
              break;

            case 'delay':
              numberIndex = DELAY;
              break;

            case 'threshold':
              numberIndex = THRESHOLD;
              break;
          }
      }
      if (numberIndex !== null) {
        const val = +parts[1];
        if (!isNaN(val)) config[numberIndex] = val;
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
    let transform = transformFns[animation]?.(progress) || EMPTY_STR;

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
      transform = 'perspective(400px) ' + parts.join(SPACE_STR);
    }

    if (animation !== 3 && direction) {
      const val = inverse * 30;
      const x = direction & DIRECTION_RIGHT ? -val : direction & DIRECTION_LEFT ? val : 0;
      const y = direction & DIRECTION_DOWN ? -val : direction & DIRECTION_UP ? val : 0;
      if (x || y) transform += ` translate(${x}px, ${y}px)`;
    }

    return transform || NONE_STR;
  };

  const setupCount = (element, config, data) => {
    const text = element.textContent || EMPTY_STR;
    const parts = text.split(config[COUNT]);
    if (parts.length !== 2) return false;

    const clean = config[COUNT].replace(/[^\d\s,.]/g, EMPTY_STR);
    let decimals = 0,
      value = 0;

    const nums = clean.replace(/[^\d.]/g, DOT_STR);
    const lastDot = nums.lastIndexOf(DOT_STR);
    if (lastDot > -1) {
      const after = nums.substring(lastDot + 1);
      if (after.length <= 2) {
        decimals = after.length;
        value = parseFloat(nums);
      } else {
        value = parseFloat(nums.replace(/\./g, EMPTY_STR));
      }
    } else {
      value = parseFloat(clean.replace(/\D/g, EMPTY_STR));
    }

    const span = document.createElement(SPAN_STR);
    span.textContent = '0';
    $(span, { display: 'inline', visibility: 'visible' });

    element.innerHTML = EMPTY_STR;
    element.appendChild(document.createTextNode(parts[0]));
    element.appendChild(span);
    element.appendChild(document.createTextNode(parts[1]));

    data.countData = [value, decimals, config[COUNT]];
    data.countSpan = span;
    return true;
  };

  const formatNumber = (value, original, decimals) => {
    let formatted = decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toString();
    if (original.includes(SPACE_STR) || original.includes(',')) {
      const parts = formatted.split(DOT_STR);

      const separator = original.includes(SPACE_STR) ? SPACE_STR : ',';
      let result = EMPTY_STR;
      let count = 0;

      for (let i = parts[0].length - 1; i >= 0; i--) {
        if (count === 3) {
          result = separator + result;
          count = 0;
        }
        result = parts[0][i] + result;
        count++;
      }

      parts[0] = result;
      formatted = parts.join(decimals > 0 ? DOT_STR : EMPTY_STR);
    }
    return formatted;
  };

  // Unified split function
  const setupSplit = (element, config) => {
    const targets = [];
    const opacity = config[TEXT] ? '1' : '0';

    const createStyledSpan = (content) => {
      const span = document.createElement(SPAN_STR);
      span.textContent = content;
      $(span, { display: 'inline-block', opacity });
      return span;
    };

    const processWord = (word) => {
      const wordContainer = document.createElement(SPAN_STR);
      $(wordContainer, { display: 'inline-block', whiteSpace: 'nowrap' });
      let contents = [word];
      if (config[SPLIT] === 'letter') {
        if (typeof Intl !== 'undefined' && Intl.Segmenter) {
          const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
          contents = Array.from(segmenter.segment(word), (s) => s.segment);
        } else {
          contents = Array.from(word);
        }
      }
      contents.forEach((content) => {
        const span = createStyledSpan(content);
        wordContainer.appendChild(span);
        targets.push(span);
      });
      return wordContainer;
    };

    if (config[SPLIT] === 'item') {
      Array.from(element.children).forEach((child) => {
        $(child, { opacity });
        targets.push(child);
      });
      return targets;
    }

    const text = element.textContent || EMPTY_STR;
    const words = text.split(/(\s+)/);
    element.innerHTML = EMPTY_STR;

    words.forEach((word) => {
      if (!word) return;

      if (/\s/.test(word)) {
        element.appendChild(document.createTextNode(word));
      } else {
        element.appendChild(processWord(word));
      }
    });

    return targets;
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

  const animate = (data, instance) => {
    data.state = ANIMATING;

    const { config, element, targets, countSpan, countData } = data;

    // Text animation effects
    if (config[TEXT]) {
      data.rafId = animateText(
        targets || [element],
        config[TEXT],
        config[DURATION] ?? instance.config.duration
      );
      data.state = COMPLETED;
      return;
    }

    // Initial state
    if (!countSpan && !targets) {
      const transform = getTransform(config[ANIMATION], config[DIRECTION], 0);
      $(element, {
        opacity: '0',
        transform: transform !== NONE_STR ? transform : 'translateZ(0)',
        filter: config[BLUR] ? 'blur(10px)' : null,
        willChange: 'transform,opacity',
      });
    }

    const start = performance.now() + (config[DELAY] ?? instance.config.delay);
    const easing = easings[config[EASING]] || easings[0];
    const splitConfig = data.splitConfig || config;
    const duration = config[DURATION] ?? instance.config.duration;

    // Main animation loop
    const tick = () => {
      const elapsed = Math.max(0, performance.now() - start);
      const progress = Math.min(elapsed / duration, 1);
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
          transform: transform !== NONE_STR ? transform : 'translateZ(0)',
          filter: config[BLUR] && animProgress < 1 ? `blur(${(1 - animProgress) * 10}px)` : null,
          willChange: animProgress < 1 ? 'transform,opacity' : 'auto',
        });
      };

      // Unified completion check
      let done = true;

      if (targets) {
        targets.forEach((target, index) => {
          const targetDelay = index * (config[SPLIT_DELAY] ?? instance.config.splitDelay);
          const targetElapsed = elapsed - targetDelay;
          if (targetElapsed < 0) {
            done = false;
            return;
          }
          const targetProgress = Math.min(targetElapsed / duration, 1);
          applyAnimation(target, easing(targetProgress), splitConfig);
          if (targetProgress < 1) done = false;
        });
      } else {
        applyAnimation(element, eased, config);
        done = progress >= 1;
      }

      if (!done) {
        data.rafId = requestAnimationFrame(tick);
      } else {
        data.state = COMPLETED;
      }
    };

    data.rafId = requestAnimationFrame(tick);
  };

  const animateIfVisible = (data, instance) => {
    // Skip if already animating
    if (data.state === ANIMATING) return;

    // Handle completed animations
    if (data.state === COMPLETED) {
      const isOnce = data.config[ONCE] ?? instance.config.once;
      if (data.visibilityRatio < 0.01 && !isOnce) {
        reset(data, instance);
      }
      return;
    }

    // Check threshold and concurrency limits
    const threshold = Math.max(
      0,
      Math.min(1, (data.config[THRESHOLD] ?? instance.config.threshold) / 100)
    );

    if (data.visibilityRatio < threshold) {
      return;
    }

    animate(data, instance);
  };

  const reset = (data, instance) => {
    if (data.rafId) {
      cancelAnimationFrame(data.rafId);
    }

    const { element, targets, countSpan, original, config } = data;

    // Reset styles
    const resetStyles = { opacity: '0', transform: EMPTY_STR, filter: EMPTY_STR };

    if (!config[TEXT] && !countSpan && !targets) {
      $(element, resetStyles);
    } else {
      $(element, original, true);
    }

    if (countSpan) countSpan.textContent = '0';
    if (targets) targets.forEach((target) => $(target, resetStyles));

    // Reset state based on 'once'
    if (!(config[ONCE] ?? instance.config.once)) {
      data.state = IDLE;
    } else {
      data.state = COMPLETED;
    }
  };

  const processElement = (element, instance, elementObserver) => {
    let id = element.getAttribute(DATA_USAL_ID);
    if (!id) {
      id = 'u' + Date.now() + Math.random().toString(36).substr(2, 5);
      element.setAttribute(DATA_USAL_ID, id);
    }

    // Check if already processed
    const existing = instance.elements.get(id);
    if (existing) {
      const newClasses = element.getAttribute(DATA_USAL) || EMPTY_STR;
      if (newClasses !== existing.configString && existing.state !== ANIMATING) {
        // Config changed, reset and reprocess
        reset(existing, instance);
        elementObserver.unobserve(element);
      } else {
        // Already processed and no changes
        return existing;
      }
    }

    const classes = element.getAttribute(DATA_USAL) || EMPTY_STR;
    const config = parseClasses(classes);

    const data = {
      element,
      config,
      configString: classes,
      original: {
        opacity: element.style.opacity || EMPTY_STR,
        transform: element.style.transform || EMPTY_STR,
        filter: element.style.filter || EMPTY_STR,
      },
      targets: null,
      state: IDLE,
      rafId: null,
      visibilityRatio: 0,
    };

    if (config[COUNT]) setupCount(element, config, data);
    if (config[SPLIT]) {
      data.targets = setupSplit(element, config);
      if (config[SPLIT_ANIMATION]) data.splitConfig = parseClasses(config[SPLIT_ANIMATION]);
    }

    if (!config[TEXT] && !data.countSpan && !data.targets) {
      $(element, { opacity: '0' });
    }

    instance.elements.set(id, data);

    // Add IntersectionObserver for this specific element
    elementObserver.observe(element);

    return data;
  };

  const setupObservers = (instance) => {
    // Local state - specific to this observer setup
    const domObservers = new Set();
    const resizeObservers = new Set();
    const observedDOMs = new Set();
    let lastScan = 0;
    let debounceTimer = null;

    // Create IntersectionObserver for visibility tracking
    const elementObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const data = instance.elements.get(entry.target.getAttribute(DATA_USAL_ID));
          if (data) {
            data.visibilityRatio = entry.intersectionRatio;
            animateIfVisible(data, instance);
          }
        });
      },
      { threshold: INTERSECTION_THRESHOLDS }
    );

    // Recursively collect all DOM nodes including shadow roots
    const collectAllDOMs = (root = document.body, collected = new Set()) => {
      if (collected.has(root)) return collected;
      collected.add(root);
      root.querySelectorAll(ASTERISK_STR).forEach((el) => {
        if (el.shadowRoot && !collected.has(el.shadowRoot)) {
          collectAllDOMs(el.shadowRoot, collected);
        }
      });
      return collected;
    };

    // Set up mutation and resize observers for a DOM node
    const observeDOM = (dom) => {
      const mutationObs = new MutationObserver(handleObserverEvents);
      mutationObs.observe(dom, {
        childList: true,
        subtree: true,
        attributes: true,
      });
      domObservers.add(mutationObs);

      const resizeObs = new ResizeObserver(handleObserverEvents);
      if (dom === document.body || dom.host) {
        resizeObs.observe(dom === document.body ? dom : dom.host);
        resizeObservers.add(resizeObs);
      }
    };

    // Main function to scan all DOMs and process elements
    const scanAllDOMs = () => {
      const allDOMs = collectAllDOMs();

      allDOMs.forEach((dom) => {
        if (!observedDOMs.has(dom)) {
          observeDOM(dom);
          observedDOMs.add(dom);
        }
        dom.querySelectorAll?.(DATA_USAL_SELECTOR).forEach((element) => {
          processElement(element, instance, elementObserver);
        });
      });

      // Clean up removed elements
      const toRemove = [];
      instance.elements.forEach((data, id) => {
        if (!data.element.isConnected) {
          if (data.rafId) cancelAnimationFrame(data.rafId);
          elementObserver?.unobserve(data.element);
          toRemove.push(id);
        } else animateIfVisible(data, instance);
      });
      toRemove.forEach((id) => instance.elements.delete(id));
      lastScan = Date.now();
    };

    // Event handler with debouncing logic
    const handleObserverEvents = (events) => {
      const items = Array.isArray(events) ? events : [events];
      const hasUsalFragment = (target) => {
        if (!target || !target.getAttribute) return false;
        return target.hasAttribute(DATA_USAL_FRAGMENT);
      };

      let cancel = null;
      for (const item of items) {
        if (item.type === 'attributes') {
          const attrName = item.attributeName;
          if (attrName === DATA_USAL || attrName === DATA_USAL_ID) {
            scanAllDOMs();
            return;
          }
        }
        if (cancel === null) {
          if (hasUsalFragment(item.target)) cancel = true;
          if (item.type === 'childList') {
            const hasUsalFragmentChild = [...item.addedNodes, ...item.removedNodes].some(
              hasUsalFragment
            );
            if (hasUsalFragmentChild) cancel = true;
          }
        }
      }
      if (cancel) return;

      const timeSinceLastScan = Date.now() - lastScan;
      if (timeSinceLastScan >= THROTTLE_DELAY) {
        scanAllDOMs();
      } else {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          scanAllDOMs();
        }, THROTTLE_DELAY - timeSinceLastScan);
      }
    };

    // Start initial scan
    scanAllDOMs();

    // Return cleanup function and elementObserver
    return () => {
      // Clear debounce timer
      if (debounceTimer) clearTimeout(debounceTimer);

      // Disconnect all observers
      domObservers.forEach((observer) => observer.disconnect());
      resizeObservers.forEach((observer) => observer.disconnect());
      elementObserver.disconnect();

      // Clear sets
      domObservers.clear();
      resizeObservers.clear();
      observedDOMs.clear();
    };
  };

  const createInstance = (config = {}) => {
    let destroyTimeout;
    const instance = {
      initialized: false,
      observers: noop,
      elements: new Map(),
      config: { ...defaults, ...config },
    };

    const autoInit = () => {
      if (!instance.initialized) {
        instance.initialized = true;
        instance.observers = setupObservers(instance);
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
          // Disconnect all observers
          instance.observers();

          // Clean up elements
          instance.elements.forEach((data) => {
            if (data.rafId) cancelAnimationFrame(data.rafId);
            if (data.element?.parentNode) {
              $(data.element, data.original, true);
              data.element.removeAttribute(DATA_USAL_ID);
            }
          });

          instance.elements.clear();
          instance.observers = noop;
          instance.initialized = false;
        }, 0);
      },

      createInstance: (newConfig) => createInstance(newConfig),
    };
  };

  const globalInstance = createInstance();
  return {
    ...globalInstance,
    createInstance,
    __usalInitialized: true,
    version: '{%%VERSION%%}',
  };
})();

if (typeof window !== 'undefined' && (!window.USAL || !window.USAL.__usalInitialized)) {
  window.USAL = USAL;
}

export default USAL;
