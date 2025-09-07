// noinspection JSBitwiseOperatorUsage

const USAL = (() => {
  // Return existing instance if initialized
  if (typeof window !== 'undefined' && window.USAL?.initialized()) {
    return window.USAL;
  }

  // SSR safety
  if (typeof window === 'undefined') {
    const noop = () => {};
    return {
      config: () => ({}),
      destroy: noop,
      restart: noop,
      initialized: () => false,
      version: '{%%VERSION%%}',
    };
  }

  const SHADOW_CAPABLE_SELECTOR =
    '*:not(:is(area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr,textarea,select,option,optgroup,script,style,title,iframe,object,video,audio,canvas,map,svg,math))';

  // Data attributes - stored as constants to avoid repetition
  const DATA_USAL_ATTRIBUTE = 'data-usal';
  const DATA_USAL_ID = `${DATA_USAL_ATTRIBUTE}-id`;
  const DATA_USAL_SELECTOR = `[${DATA_USAL_ATTRIBUTE}]`;

  // Config array indices - descriptive names that will minify
  const CONFIG_ANIMATION = 0;
  const CONFIG_DIRECTION = 1;
  const CONFIG_DURATION = 2;
  const CONFIG_DELAY = 3;
  const CONFIG_THRESHOLD = 4;
  const CONFIG_EASING = 5;
  const CONFIG_BLUR = 6;
  const CONFIG_ONCE = 7;
  const CONFIG_SPLIT = 8;
  const CONFIG_COUNT = 9;
  const CONFIG_TEXT = 10;

  // Direction bit flags
  const DIRECTION_UP = 1;
  const DIRECTION_DOWN = 2;
  const DIRECTION_LEFT = 4;
  const DIRECTION_RIGHT = 8;

  // Animation states
  const STATE_IDLE = 0;
  const STATE_ANIMATING = 1;
  const STATE_COMPLETED = 2;

  // CSS property names as constants (these strings won't minify, so reuse them)
  const STYLE_OPACITY = 'opacity';
  const STYLE_TRANSFORM = 'transform';
  const STYLE_FILTER = 'filter';
  const STYLE_DISPLAY = 'display';
  const STYLE_FONT_WEIGHT = 'fontWeight';
  const CSS_NONE = 'none';
  const CSS_INLINE_BLOCK = 'inline-block';

  // Observer settings
  const INTERSECTION_THRESHOLDS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

  // Animation types - keep as array for indexOf
  const ANIMATION_TYPES = ['fade', 'zoomin', 'zoomout', 'flip'];

  // Default configuration
  const defaultConfig = {
    defaults: {
      animation: 'fade',
      direction: 'u',
      duration: 1000,
      delay: 0,
      threshold: 10,
      splitDelay: 30,
      easing: 'ease-out',
      blur: false,
    },
    observersDelay: 50,
    once: false,
  };

  const genTmpId = () => `__usal${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const cancelAllAnimations = (element, originalStyle) =>
    setTimeout(() => {
      if (!element) return;

      element
        .getAnimations()
        .filter((animation) => animation.id && animation.id.startsWith('__usal'))
        .forEach((animation) => {
          animation.cancel();
          applyStyles(element, originalStyle);
        });
    }, 0);

  const captureComputedStyle = (element) => {
    const computedStyle = window.getComputedStyle(element);
    return {
      [STYLE_OPACITY]: computedStyle[STYLE_OPACITY] || '1',
      [STYLE_TRANSFORM]: computedStyle[STYLE_TRANSFORM] || 'none',
      [STYLE_FILTER]: computedStyle[STYLE_FILTER] || 'none',
    };
  };

  function applyStyles(elementRaw, styles, clean = false) {
    const element =
      typeof elementRaw === 'string' ? document.createElement(elementRaw) : elementRaw;
    if (!element) return null;
    element.animate([styles], {
      duration: 0,
      fill: 'forwards',
      iterations: 1,
      id: genTmpId(),
    });
    if (!clean) element.__usalFragment = 1;
    else {
      delete element.__usalFragment;
      delete element.__usalOriginals;
      delete element.__usalID;
    }
    return element;
  }

  // Compose CSS values (for transform and filter)
  const composeValues = (newValue, originalValue) => {
    if (!originalValue || originalValue === CSS_NONE) return newValue;
    if (!newValue) return originalValue;
    return `${originalValue} ${newValue}`;
  };

  function extractAndSetConfig(prefix, config, configKey, classString) {
    const pattern = new RegExp(`${prefix}-\\[[^\\]]+\\]`);
    const match = classString.match(pattern);
    if (match) {
      config[configKey] = match[0].slice(prefix.length + 2, -1);
      return classString.replace(match[0], '');
    }
    return classString;
  }

  const extractAnimation = (firstPart, fallback = null) => {
    const animationIndex = ANIMATION_TYPES.indexOf(firstPart);
    return animationIndex !== -1 ? animationIndex : fallback;
  };

  const extractDirection = (secondPart, fallback = null) => {
    if (!secondPart) return fallback;

    let direction = 0;

    for (const char of secondPart) {
      switch (char) {
        case 'u':
          direction |= DIRECTION_UP;
          break;
        case 'd':
          direction |= DIRECTION_DOWN;
          break;
        case 'l':
          direction |= DIRECTION_LEFT;
          break;
        case 'r':
          direction |= DIRECTION_RIGHT;
          break;
      }
    }

    return direction > 0 ? direction : fallback;
  };

  // Parse data-usal attribute - using switch for better minification
  const parseClasses = (classString) => {
    const config = new Array(11).fill(null);

    classString = extractAndSetConfig('count', config, CONFIG_COUNT, classString);
    classString = extractAndSetConfig('easing', config, CONFIG_EASING, classString);

    const tokens = classString.trim().split(/\s+/).filter(Boolean);

    for (const token of tokens) {
      const parts = token.split('-');
      const firstPart = parts[0];

      // Check animation types first (most common)
      config[CONFIG_ANIMATION] = extractAnimation(firstPart);
      if (config[CONFIG_ANIMATION] !== null) {
        config[CONFIG_DIRECTION] = extractDirection(parts[1]);
        continue;
      }

      // Handle other tokens with switch
      switch (token) {
        case 'blur':
          config[CONFIG_BLUR] = true;
          break;
        case 'once':
          config[CONFIG_ONCE] = true;
          break;
        case 'linear':
        case 'ease':
        case 'ease-in':
        case 'ease-out':
          config[CONFIG_EASING] = token;
          break;
        default:
          // Handle complex tokens
          switch (firstPart) {
            case 'split':
              if (parts[1])
                config[CONFIG_SPLIT] = (config[CONFIG_SPLIT] ?? '') + ' ' + token.slice(6);
              break;
            case 'text':
              if (parts[1] === 'shimmer' || parts[1] === 'fluid') {
                config[CONFIG_TEXT] = parts[1];
              }
              break;
            case 'duration':
              if (parts[1]) config[CONFIG_DURATION] = +parts[1];
              break;
            case 'delay':
              if (parts[1]) config[CONFIG_DELAY] = +parts[1];
              break;
            case 'threshold':
              if (parts[1]) config[CONFIG_THRESHOLD] = +parts[1];
              break;
          }
      }
    }

    return config;
  };

  // Generate animation keyframes
  const createKeyframes = (instance, config, originalStyle = null) => {
    const animationType =
      config[CONFIG_ANIMATION] ?? extractAnimation(instance.config.defaults.animation, 0);
    const direction =
      config[CONFIG_DIRECTION] ?? extractDirection(instance.config.defaults.direction, 1);
    const hasBlur = config[CONFIG_BLUR] ?? instance.config.defaults.blur;

    const fromState = { [STYLE_OPACITY]: 0 };
    const toState = { [STYLE_OPACITY]: originalStyle?.[STYLE_OPACITY] || 1 };

    let animationTransform = '';

    // Build animation transform based on type
    if (animationType === 1) {
      // Zoom in
      animationTransform = 'scale(0.6)';
    } else if (animationType === 2) {
      // Zoom out
      animationTransform = 'scale(1.2)';
    } else if (animationType === 3) {
      // Flip
      const angle = 90;
      const transforms = [];
      if (direction & (DIRECTION_UP | DIRECTION_DOWN)) {
        transforms.push(`rotateX(${direction & DIRECTION_UP ? angle : -angle}deg)`);
      }
      if (direction & (DIRECTION_LEFT | DIRECTION_RIGHT)) {
        transforms.push(`rotateY(${direction & DIRECTION_LEFT ? -angle : angle}deg)`);
      }
      if (!transforms.length) transforms.push(`rotateY(${angle}deg)`);
      animationTransform = `perspective(400px) ${transforms.join(' ')}`;
    }

    // Add directional movement (not for flip)
    if (animationType !== 3 && direction) {
      const distance = 30;
      const translateX =
        direction & DIRECTION_RIGHT ? -distance : direction & DIRECTION_LEFT ? distance : 0;
      const translateY =
        direction & DIRECTION_DOWN ? -distance : direction & DIRECTION_UP ? distance : 0;

      if (translateX || translateY) {
        const translate = `translate(${translateX}px, ${translateY}px)`;
        animationTransform = animationTransform ? `${animationTransform} ${translate}` : translate;
      }
    }

    // Set transforms
    if (animationTransform) {
      fromState[STYLE_TRANSFORM] = composeValues(
        animationTransform,
        originalStyle?.[STYLE_TRANSFORM]
      );
    } else if (originalStyle?.[STYLE_TRANSFORM]) {
      fromState[STYLE_TRANSFORM] = originalStyle[STYLE_TRANSFORM];
    }

    if (originalStyle?.[STYLE_TRANSFORM]) {
      toState[STYLE_TRANSFORM] = originalStyle[STYLE_TRANSFORM];
    } else if (animationType === 1 || animationType === 2) {
      toState[STYLE_TRANSFORM] = 'scale(1)';
    } else if (animationType === 3) {
      toState[STYLE_TRANSFORM] = 'perspective(400px) rotateX(0) rotateY(0)';
    } else if (animationTransform) {
      toState[STYLE_TRANSFORM] = 'translate(0, 0)';
    }

    // Add blur effect
    if (hasBlur) {
      fromState[STYLE_FILTER] = composeValues('blur(10px)', originalStyle?.[STYLE_FILTER]);
      toState[STYLE_FILTER] = originalStyle?.[STYLE_FILTER] || 'blur(0)';
    } else if (originalStyle?.[STYLE_FILTER]) {
      fromState[STYLE_FILTER] = originalStyle[STYLE_FILTER];
      toState[STYLE_FILTER] = originalStyle[STYLE_FILTER];
    }

    return [fromState, toState];
  };

  // Create split elements
  const setupSplit = (element, splitBy, opacity) => {
    const targets = [];

    // Split by child elements
    if (splitBy === 'item') {
      Array.from(element.children).forEach((child) => {
        child.__usalOriginals = {
          style: captureComputedStyle(child),
          innerHTML: null,
        };
        applyStyles(child, {
          [STYLE_OPACITY]: opacity,
        });
        targets.push(child);
      });
      return targets;
    }

    // Create span helper
    const createSpan = (content) => {
      const span = applyStyles('span', {
        [STYLE_DISPLAY]: CSS_INLINE_BLOCK,
        [STYLE_OPACITY]: opacity,
      });
      span.textContent = content;
      return span;
    };

    const text = element.textContent || '';
    const words = text.split(/(\s+)/);
    element.innerHTML = '';

    words.forEach((word) => {
      if (!word) return;

      if (/\s/.test(word)) {
        element.appendChild(document.createTextNode(word));
        return;
      }

      const container = applyStyles('span', {
        [STYLE_DISPLAY]: CSS_INLINE_BLOCK,
        whiteSpace: 'nowrap',
      });

      let chars = [word];
      if (splitBy === 'letter') {
        // Use Intl.Segmenter if available
        if (typeof Intl !== 'undefined' && Intl.Segmenter) {
          const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
          chars = Array.from(segmenter.segment(word), (s) => s.segment);
        } else {
          // Fallback to regex

          // Non-capturing groups needed for proper Unicode segmentation
          // noinspection RegExpUnnecessaryNonCapturingGroup
          chars = word.match(
            /\p{RI}\p{RI}|(?:\p{Emoji}(?:\u200D\p{Emoji})*)|(?:\P{M}\p{M}*)|./gsu
          ) || [word];
        }
      }

      chars.forEach((char) => {
        const span = createSpan(char);
        container.appendChild(span);
        targets.push(span);
      });

      element.appendChild(container);
    });

    return targets;
  };

  // Setup count animation
  const setupCount = (element, config, data) => {
    const text = element.textContent || '';
    const parts = text.split(config[CONFIG_COUNT]);
    if (parts.length !== 2) return false;

    const original = config[CONFIG_COUNT].trim();
    const clean = original.replace(/[^\d\s,.]/g, '');

    const separators = [',', '.', ' '].filter((s) => clean.includes(s));
    const sepPositions = separators
      .map((s) => ({ s, p: clean.lastIndexOf(s) }))
      .sort((a, b) => b.p - a.p);

    let value,
      decimals = 0,
      thousandSep = '',
      decimalSep = '';

    if (separators.length === 0) {
      value = parseFloat(clean);
    } else if (separators.length === 1) {
      const sep = separators[0];
      const afterSep = clean.substring(clean.lastIndexOf(sep) + 1);

      if (afterSep.length <= 3 && afterSep.length > 0 && sep !== ' ') {
        decimalSep = sep;
        decimals = afterSep.length;
        value = parseFloat(clean.replace(sep, '.'));
      } else {
        thousandSep = sep;
        value = parseFloat(clean.replace(new RegExp(`\\${thousandSep}`, 'g'), ''));
      }
    } else {
      decimalSep = sepPositions[0].s;
      thousandSep = sepPositions[1].s;
      const processed = clean
        .replace(new RegExp(`\\${thousandSep}`, 'g'), '')
        .replace(decimalSep, '.');
      value = parseFloat(processed);
      decimals = clean.substring(sepPositions[0].p + 1).replace(/\D/g, '').length;
    }

    const span = applyStyles('span', {
      [STYLE_DISPLAY]: 'inline',
    });
    span.textContent = '0';

    element.innerHTML = '';
    element.appendChild(document.createTextNode(parts[0]));
    element.appendChild(span);
    element.appendChild(document.createTextNode(parts[1]));

    data.countData = { value, decimals, original, span, thousandSep, decimalSep };
    return true;
  };

  // Animate count
  const animateCount = (data, instance) => {
    const { value, decimals, original, span, thousandSep, decimalSep } = data.countData;
    const duration = data.config[CONFIG_DURATION] ?? instance.config.defaults.duration;
    const delay = data.config[CONFIG_DELAY] ?? instance.config.defaults.delay;
    const easing = data.config[CONFIG_EASING] ?? instance.config.defaults.easing;
    const start = performance.now() + delay;

    const easingFunction =
      easing === 'linear'
        ? (t) => t
        : easing === 'ease'
          ? (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)
          : easing === 'ease-in'
            ? (t) => t * t * t
            : (t) => 1 - Math.pow(1 - t, 3);

    const formatNumber = (val) => {
      const parts = (decimals > 0 ? val.toFixed(decimals) : Math.floor(val).toString()).split('.');

      if (thousandSep && parts[0].length > 3) {
        const reversed = parts[0].split('').reverse();
        parts[0] = reversed.reduce(
          (acc, digit, i) => (i > 0 && i % 3 === 0 ? digit + thousandSep + acc : digit + acc),
          ''
        );
      }

      return parts.length > 1 && decimalSep ? parts[0] + decimalSep + parts[1] : parts[0];
    };

    const tick = () => {
      const elapsed = Math.max(0, performance.now() - start);
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFunction(progress);

      span.textContent = progress >= 1 ? original : formatNumber(value * easedProgress);

      if (progress < 1) {
        data.rafId = requestAnimationFrame(tick);
      } else {
        data.state = STATE_COMPLETED;
        data.onfinish();
      }
    };

    data.rafId = requestAnimationFrame(tick);
  };

  // Create text effect animations
  const animateTextEffect = (targets, type, duration, splitDelay) => {
    const animations = [];

    targets.forEach((target, index) => {
      const frames = Array.from({ length: 17 }, (_, i) => {
        const progress = i / 16;
        const wave = (Math.sin(progress * Math.PI * 2) + 1) / 2;

        if (type === 'shimmer') {
          return {
            [STYLE_OPACITY]: 0.5 + wave * 0.5,
            [STYLE_FILTER]: `brightness(${1 + wave * 0.3})`,
            offset: progress,
          };
        }

        return {
          [STYLE_FONT_WEIGHT]: Math.round(100 + wave * 800).toString(),
          offset: progress,
        };
      });

      const animation = target.animate(frames, {
        duration: duration,
        iterations: Infinity,
        delay: index * splitDelay,
        easing: 'linear',
        iterationStart: 0.5,
      });

      animations.push(animation);
    });

    return () => {
      animations.forEach((animation) => {
        animation.cancel();
      });
      animations.length = 0;
    };
  };

  // Main animation controller
  const animate = (data, instance) => {
    if (data.state !== STATE_IDLE) return;
    data.state = STATE_ANIMATING;

    const { config, element, targets, countData, splitConfig } = data;

    const duration = config[CONFIG_DURATION] ?? instance.config.defaults.duration;
    const delay = config[CONFIG_DELAY] ?? instance.config.defaults.delay;
    const easing = config[CONFIG_EASING] ?? instance.config.defaults.easing;
    const splitDelay = splitConfig[CONFIG_DELAY] ?? instance.config.defaults.splitDelay;

    // Handle text effects
    if (config[CONFIG_TEXT]) {
      data.cleanTextEffect = animateTextEffect(
        targets || [element],
        config[CONFIG_TEXT],
        duration,
        splitDelay
      );
      data.state = STATE_COMPLETED;
      return;
    }

    // Handle count animation
    if (countData) {
      animateCount(data, instance);
      return;
    }

    // Create keyframes
    const keyframes = createKeyframes(instance, config, element.__usalOriginals.style);
    const options = {
      duration,
      delay,
      easing,
      fill: 'forwards',
      id: genTmpId(),
    };

    // Animate split elements OR single element (not both)
    if (targets) {
      const animationPromises = targets.map((target, index) => {
        const originalStyle = target.__usalOriginals?.style || element.__usalOriginals.style;
        const splitKeyframes = createKeyframes(instance, data.splitConfig, originalStyle);

        const animation = target.animate(splitKeyframes, {
          ...options,
          delay: delay + index * splitDelay,
        });

        animation.persist();

        return new Promise((resolve) => {
          animation.onfinish = () => {
            cancelAllAnimations(target, originalStyle);
            resolve();
          };
        });
      });

      Promise.all(animationPromises).then(() => {
        data.state = STATE_COMPLETED;
        data.onfinish();
      });
    } else {
      // Animate single element
      const animation = element.animate(keyframes, options);
      const originalStyle = element.__usalOriginals.style;
      animation.persist();
      animation.onfinish = () => {
        data.state = STATE_COMPLETED;
        cancelAllAnimations(element, originalStyle);
        data.onfinish();
      };
    }
  };
  // Reset element
  const reset = (data, instance, isDestroy = false) => {
    // Cancel animations
    if (data.rafId) {
      cancelAnimationFrame(data.rafId);
      data.rafId = null;
    }
    data.cleanTextEffect();

    if (isDestroy) {
      const splitByItem = data.config[CONFIG_SPLIT]?.includes('item');
      if (data.targets && splitByItem) {
        data.targets.forEach((target) => applyStyles(target, target.__usalOriginals.style, true));
      }
      if (!splitByItem && (data.config[CONFIG_SPLIT] || data.countData))
        data.element.innerHTML = data.element.__usalOriginals.innerHTML;
      applyStyles(data.element, data.element.__usalOriginals.style, true);
    } else if (data.countData) {
      // Normal reset
      data.countData.span.textContent = '0';
    } else if (!data.config[CONFIG_TEXT]) {
      if (data.targets) {
        data.targets.forEach((target) => {
          applyStyles(target, { [STYLE_OPACITY]: '0' });
        });
      } else {
        applyStyles(data.element, { [STYLE_OPACITY]: '0' });
      }
    }

    const isOnce = data.config[CONFIG_ONCE] ?? instance.config.once;
    data.state = isDestroy ? STATE_IDLE : isOnce ? STATE_COMPLETED : STATE_IDLE;
  };
  // Process element
  const processElement = (element, instance, elementObserver) => {
    element.__usalFragment = 1;

    if (!element.__usalID) {
      element.__usalOriginals = {
        style: captureComputedStyle(element),
        innerHTML: element.innerHTML,
      };
      element.__usalID = element.getAttribute(DATA_USAL_ID) ?? genTmpId();
    }

    const classes = element.getAttribute(DATA_USAL_ATTRIBUTE) || '';

    const existing = instance.elements.get(element.__usalID);
    if (existing) {
      if (classes !== existing.configString) {
        existing.onfinish = () => {
          existing.onfinish = () => {};
          elementObserver.unobserve(element);
          requestAnimationFrame(() => {
            reset(existing, instance, true);
            requestAnimationFrame(() => {
              const data = processElement(element, instance, elementObserver);
              requestAnimationFrame(() => {
                animateIfVisible(data, instance);
              });
            });
          });
        };
        if (existing.state !== STATE_ANIMATING) existing.onfinish();
      } else {
        return existing;
      }
    }

    const config = parseClasses(classes);

    const data = {
      element,
      config,
      splitConfig: [...config],
      configString: classes,
      targets: null,
      state: STATE_IDLE,
      cleanTextEffect: () => {},
      rafId: null,
      onfinish: () => {},
    };

    // Setup special animations
    if (config[CONFIG_COUNT]) {
      setupCount(element, config, data);
    }

    const splitBy = config[CONFIG_SPLIT]?.split(' ').find((item) =>
      ['word', 'letter', 'item'].includes(item)
    );
    if (splitBy) {
      data.targets = setupSplit(element, splitBy, config[CONFIG_TEXT] ? '1' : '0');
      const splitOverrides = parseClasses(config[CONFIG_SPLIT]);
      data.splitConfig = config.map((value, index) => splitOverrides[index] ?? value);
    }

    // Hide element initially
    if (!config[CONFIG_TEXT] && !config[CONFIG_COUNT] && !config[CONFIG_SPLIT]) {
      applyStyles(element, { [STYLE_OPACITY]: '0' });
    }

    instance.elements.set(element.__usalID, data);
    elementObserver.observe(element);

    return data;
  };

  const calculateVisibilityRatio = (element) => {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    if (
      rect.bottom <= 0 ||
      rect.top >= windowHeight ||
      rect.right <= 0 ||
      rect.left >= windowWidth
    ) {
      return 0;
    }
    const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
    const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);
    return (visibleHeight / rect.height) * (visibleWidth / rect.width);
  };

  // Check visibility and animate
  const animateIfVisible = (data, instance, ratio = null) => {
    if (data.state === STATE_ANIMATING) {
      return;
    }
    const _ratio = ratio ?? calculateVisibilityRatio(data.element);

    if (data.state === STATE_COMPLETED) {
      const isOnce = data.config[CONFIG_ONCE] ?? instance.config.once;
      if (_ratio < 0.01 && !isOnce) {
        reset(data, instance);
      }
      return;
    }

    const threshold = Math.max(
      0,
      Math.min(1, (data.config[CONFIG_THRESHOLD] ?? instance.config.defaults.threshold) / 100)
    );

    if (_ratio >= threshold) {
      animate(data, instance);
    }
  };

  // Setup observers
  const setupObservers = (instance) => {
    const domObservers = new Set();
    const resizeObservers = new Set();
    const observedDOMs = new Set();
    let lastScan = 0;
    let throttleOnTailTimer = null;

    // Intersection observer
    const elementObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const data = instance.elements.get(
            entry.target.__usalID || entry.target.getAttribute(DATA_USAL_ID)
          );
          if (data) {
            animateIfVisible(data, instance, entry.intersectionRatio);
          }
        });
      },
      { threshold: INTERSECTION_THRESHOLDS }
    );

    // Collect all DOMs including shadow roots

    const collectAllDOMs = (root = document.body, collected = new Set()) => {
      if (collected.has(root)) return collected;
      collected.add(root);

      for (const el of root.querySelectorAll(SHADOW_CAPABLE_SELECTOR)) {
        if (el.shadowRoot && !collected.has(el.shadowRoot)) {
          // noinspection JSCheckFunctionSignatures
          collectAllDOMs(el.shadowRoot, collected);
        }
      }

      return collected;
    };

    // Setup DOM observation
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

    // Scan all DOMs
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

      // Clean disconnected elements
      const toRemove = [];
      instance.elements.forEach((data, id) => {
        if (!data.element.isConnected) {
          elementObserver.unobserve(data.element);
          reset(data, instance, true);
          toRemove.push(id);
        } else {
          animateIfVisible(data, instance);
        }
      });
      toRemove.forEach((id) => instance.elements.delete(id));
      lastScan = Date.now();
    };

    // Handle observer events
    const handleObserverEvents = (events) => {
      const items = Array.isArray(events) ? events : [events];

      const hasUsalFragment = (target) => !!target.__usalFragment;

      let cancel = null;
      for (const item of items) {
        if (item.type === 'attributes') {
          const attrName = item.attributeName;
          if (attrName === DATA_USAL_ATTRIBUTE || attrName === DATA_USAL_ID) {
            processElement(item.target, instance, elementObserver);
            cancel = true;
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
      if (timeSinceLastScan >= instance.config.observersDelay) {
        scanAllDOMs();
      } else {
        if (throttleOnTailTimer) clearTimeout(throttleOnTailTimer);
        throttleOnTailTimer = setTimeout(
          () => {
            scanAllDOMs();
          },
          Math.max(0, instance.config.observersDelay - timeSinceLastScan)
        );
      }
    };
    scanAllDOMs();

    return () => {
      clearTimeout(throttleOnTailTimer);
      domObservers.forEach((obs) => obs.disconnect());
      resizeObservers.forEach((obs) => obs.disconnect());
      elementObserver.disconnect();
      domObservers.clear();
      resizeObservers.clear();
      observedDOMs.clear();
    };
  };

  // Instance state
  const instanceState = {
    initialized: false,
    observers: () => {},
    elements: new Map(),
    config: { ...defaultConfig },
  };

  // Auto-initialize
  const autoInit = () => {
    if (!instanceState.initialized) {
      instanceState.initialized = true;
      instanceState.observers = setupObservers(instanceState);
    }
  };

  // Public API
  const publicAPI = {
    config(newConfig = {}) {
      if (arguments.length === 0) return { ...instanceState.config };
      Object.assign(instanceState.config, newConfig);
      return publicAPI;
    },

    destroy() {
      instanceState.observers();
      instanceState.elements.forEach((data) => {
        reset(data, instanceState, true);
      });
      instanceState.elements.clear();
      instanceState.observers = () => {};
      instanceState.initialized = false;
      return publicAPI;
    },

    restart() {
      publicAPI.destroy();
      setTimeout(() => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', autoInit, { once: true });
        } else {
          autoInit();
        }
      }, 0);
      return publicAPI;
    },

    initialized: () => instanceState.initialized,
    version: '{%%VERSION%%}',
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit, { once: true });
  } else {
    requestAnimationFrame(autoInit);
  }

  return publicAPI;
})();

// Export for modules
if (typeof window !== 'undefined') {
  window.USAL = USAL;
}

export default USAL;
