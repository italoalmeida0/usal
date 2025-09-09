// noinspection JSBitwiseOperatorUsage

const USAL = (() => {
  // Return existing instance if initialized
  if (typeof window !== 'undefined' && window.USAL?.initialized()) {
    return window.USAL;
  }

  // SSR safety
  if (typeof window === 'undefined') {
    const asyncNoop = async function () {
      return this;
    };
    return {
      config: function () {
        return arguments.length === 0 ? {} : this;
      },
      destroy: asyncNoop,
      restart: asyncNoop,
      initialized: () => false,
      version: '{%%VERSION%%}',
    };
  }

  // ============================================================================
  // Configuration & State
  // ============================================================================

  const defaultConfig = {
    defaults: {
      animation: 'fade',
      direction: 'u',
      duration: 1000,
      delay: 0,
      threshold: 10,
      splitDelay: 30,
      forwards: false,
      easing: 'ease-out',
      blur: false,
    },
    observersDelay: 50,
    once: false,
  };

  const instance = {
    destroying: null,
    restarting: null,
    initialized: false,
    observers: () => {},
    elements: new Map(),
    config: { ...defaultConfig },
  };

  // ============================================================================
  // Constants
  // ============================================================================

  const SHADOW_CAPABLE_SELECTOR =
    '*:not(:is(area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr,textarea,select,option,optgroup,script,style,title,iframe,object,video,audio,canvas,map,svg,math))';

  const DATA_USAL_ATTRIBUTE = 'data-usal';
  const DATA_USAL_ID = `${DATA_USAL_ATTRIBUTE}-id`;
  const DATA_USAL_SELECTOR = `[${DATA_USAL_ATTRIBUTE}]`;

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
  const CONFIG_LOOP = 11;
  const CONFIG_FORWARDS = 12;
  const CONFIG_TUNING = 13;
  const CONFIG_LINE = 14;

  const DIRECTION_UP = 1;
  const DIRECTION_DOWN = 2;
  const DIRECTION_LEFT = 4;
  const DIRECTION_RIGHT = 8;

  const STYLE_OPACITY = 'opacity';
  const STYLE_TRANSFORM = 'transform';
  const STYLE_FILTER = 'filter';
  const STYLE_PERSPECTIVE = 'perspective';
  const STYLE_DISPLAY = 'display';
  const STYLE_FONT_WEIGHT = 'fontWeight';
  const CSS_NONE = 'none';
  const CSS_INLINE_BLOCK = 'inline-block';

  const INTERSECTION_THRESHOLDS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
  const ANIMATION_TYPES = ['fade', 'zoomin', 'zoomout', 'flip'];

  // ============================================================================
  // Utilities
  // ============================================================================

  const genTmpId = () => `__usal${Date.now()}_${Math.random().toString(36).slice(2)}`;

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

  const captureComputedStyle = (element) => {
    const computedStyle = window.getComputedStyle(element);
    return {
      [STYLE_OPACITY]: computedStyle[STYLE_OPACITY] || '1',
      [STYLE_TRANSFORM]: computedStyle[STYLE_TRANSFORM] || CSS_NONE,
      [STYLE_FILTER]: computedStyle[STYLE_FILTER] || CSS_NONE,
      [STYLE_PERSPECTIVE]: computedStyle[STYLE_PERSPECTIVE] || CSS_NONE,
    };
  };

  // ============================================================================
  // Style Management
  // ============================================================================

  function applyStyles(element, styles, clean = false) {
    if (!element) return;

    // eslint-disable-next-line no-unused-vars
    const { offset, composite, easing, ...cleanedStyles } = styles;

    element.animate([cleanedStyles], {
      duration: 0,
      fill: 'forwards',
      iterations: 1,
      id: genTmpId(),
    });

    if (instance.destroying == null && !clean) {
      element.__usalFragment = 1;
    } else {
      delete element.__usalFragment;
      delete element.__usalOriginals;
      delete element.__usalID;
    }
  }

  const cancelAllAnimations = (data, element, originalStyle) =>
    new Promise((resolve) => {
      setTimeout(() => {
        if (!element) {
          resolve();
          return;
        }
        element
          .getAnimations()
          .filter((animation) => animation.id && animation.id.startsWith('__usal'))
          .forEach((animation) => {
            animation.cancel();
            if (originalStyle) applyStyles(element, originalStyle);
          });
        resolve();
      }, 0);
    });

  const resetStyle = (data) => {
    if (data.config[CONFIG_LOOP]) return;
    const originalStyle = data.element.__usalOriginals?.style;
    if (data.countData) {
      const span = data.countData.span;
      applyStyles(span, {
        [STYLE_DISPLAY]: 'inline',
      });
      span.textContent = '0';
    } else if (data.config[CONFIG_SPLIT]) {
      if (data.targets) {
        data.targets.forEach((target) => {
          applyStyles(
            target,
            createKeyframes(data.config, target.__usalOriginals?.style || originalStyle)[0]
          );
        });
      }
    } else {
      applyStyles(data.element, createKeyframes(data.config, originalStyle)[0]);
    }
    data.stop = false;
  };
  // ============================================================================
  // Configuration Parsing
  // ============================================================================

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

  const parseClasses = (classString) => {
    const config = new Array(15).fill(null);
    config[CONFIG_LOOP] = false;
    config[CONFIG_TUNING] = [];
    classString = classString.toLowerCase().trim();

    classString = extractAndSetConfig('count', config, CONFIG_COUNT, classString);
    classString = extractAndSetConfig('easing', config, CONFIG_EASING, classString);
    classString = extractAndSetConfig('line', config, CONFIG_LINE, classString);

    const tokens = classString.split(/\s+/).filter(Boolean);

    for (const token of tokens) {
      const parts = token.split('-');
      const firstPart = parts[0];

      config[CONFIG_ANIMATION] = extractAnimation(firstPart);
      if (config[CONFIG_ANIMATION] !== null) {
        config[CONFIG_DIRECTION] = extractDirection(parts[1]);
        config[CONFIG_TUNING] = parts
          .slice(1 + (config[CONFIG_DIRECTION] ? 1 : 0))
          .filter((item) => !isNaN(item) && item !== '')
          .map((item) => +item);
        continue;
      }

      switch (token) {
        case 'loop':
          config[CONFIG_LOOP] = true;
          break;
        case 'once':
          config[CONFIG_ONCE] = true;
          break;
        case 'forwards':
          config[CONFIG_FORWARDS] = true;
          break;
        case 'linear':
        case 'ease':
        case 'ease-in':
        case 'ease-out':
        case 'ease-in-out':
        case 'step-start':
        case 'step-end':
          config[CONFIG_EASING] = token;
          break;
        default:
          switch (firstPart) {
            case 'split':
              if (parts[1])
                config[CONFIG_SPLIT] = (config[CONFIG_SPLIT] ?? '') + ' ' + token.slice(6);
              break;
            case 'blur':
              if (parts[1]) config[CONFIG_BLUR] = +parts[1];
              else config[CONFIG_BLUR] = true;
              break;
            case 'text':
              if (parts[1] === 'shimmer' || parts[1] === 'fluid') {
                config[CONFIG_TEXT] = parts[1];
                config[CONFIG_LOOP] = true;
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

  // ============================================================================
  // Animation Keyframes
  // ============================================================================

  function parseTimeline(content, originalStyle, inlineBlock = false) {
    const clean = content.replace(/\s/g, '').toLowerCase();

    const buildTransform = (type, axis, value, unit) => {
      const axisStr =
        axis && ['x', 'y', 'z'].includes(axis) ? axis.toUpperCase() : type === 'rotate' ? 'Z' : '';
      return `${type}${axisStr}(${value}${unit})`;
    };

    const parseTransforms = (str) => {
      const regex = /(\w|\w\w)([+-]\d+(?:\.\d+)?)/g;

      let transforms = '';
      let opacity = null;
      let filter = null;
      let perspective = null;

      let match;
      while ((match = regex.exec(str)) !== null) {
        const [, prop, value] = match;
        const num = parseFloat(value);
        const first = prop[0];
        const second = prop[1];

        switch (first) {
          case 't':
            transforms += ' ' + buildTransform('translate', second, num, '%');
            break;
          case 'r':
            transforms += ' ' + buildTransform('rotate', second, num, 'deg');
            break;
          case 's':
            transforms += ' ' + buildTransform('scale', second, num, '');
            break;
          case 'o':
            opacity = Math.max(0, Math.min(100, num)) / 100;
            break;
          case 'b':
            filter = `blur(${Math.max(0, num)}rem)`;
            break;
          case 'p':
            perspective = `${num}rem`;
            break;
        }
      }

      const result = {};
      if (transforms) result[STYLE_TRANSFORM] = transforms.trim();
      if (opacity !== null) result[STYLE_OPACITY] = opacity;
      if (filter) result[STYLE_FILTER] = filter;
      if (perspective) result[STYLE_PERSPECTIVE] = perspective;
      return result;
    };

    const keyframes = new Map();
    clean.split('|').forEach((frame, index) => {
      const percentMatch = frame.match(/^(\d+)/);
      const percent =
        index === 0
          ? 0
          : percentMatch
            ? Math.max(0, Math.min(100, parseInt(percentMatch[1])))
            : 100;
      keyframes.set(percent, parseTransforms(frame.replace(/^\d+/, '')));
    });

    if (Object.keys(keyframes.get(0)).length === 0) {
      keyframes.set(0, originalStyle);
    }
    if (keyframes.size === 1) {
      keyframes.set(100, originalStyle);
    } else {
      const allKeys = [...keyframes.keys()];
      if (keyframes.size >= 3) {
        const minKey = Math.min(...allKeys);
        keyframes.set(0, keyframes.get(minKey));
      }
      const maxKey = Math.max(...allKeys);
      keyframes.set(100, keyframes.get(maxKey));
    }

    return Array.from(keyframes.entries())
      .filter(([_, frame]) => Object.keys(frame).length > 0)
      .sort((a, b) => a[0] - b[0])
      .map(([offset, frame]) => ({
        offset: offset / 100,
        ...frame,
        ...(inlineBlock && { display: 'inline-block' }),
      }));
  }

  const createKeyframes = (config, originalStyle) => {
    if (!originalStyle) return;
    const splitByNotItem = config[CONFIG_SPLIT] && !config[CONFIG_SPLIT]?.includes('item');
    if (config[CONFIG_LINE])
      return parseTimeline(config[CONFIG_LINE], originalStyle, splitByNotItem);

    const animationType =
      config[CONFIG_ANIMATION] ?? extractAnimation(instance.config.defaults.animation, 0);
    const direction =
      config[CONFIG_DIRECTION] ?? extractDirection(instance.config.defaults.direction, 1);
    const blur = config[CONFIG_BLUR] ?? instance.config.defaults.blur;

    const tuning = config[CONFIG_TUNING];

    let firstTuning = tuning?.at(0);
    const lastTuning = tuning?.at(-1);
    let secondTuning = tuning?.at(1);

    let fromTimeline = 'o+0';

    const defaultDelta = splitByNotItem ? 50 : 15;
    const intensity = (lastTuning ?? defaultDelta) / 100;

    if (animationType === 1 || animationType === 2) {
      // Zoom
      fromTimeline += `s+${1 + (animationType === 1 ? -intensity : intensity)}`;
      firstTuning = null;
      secondTuning = tuning?.length === 2 ? null : secondTuning;
    } else if (animationType === 3) {
      // Flip
      const angle = firstTuning ?? 90;
      if (direction & (DIRECTION_UP | DIRECTION_DOWN)) {
        const rotX = direction & DIRECTION_UP ? angle : -angle;
        fromTimeline += `rx${rotX > 0 ? '+' : ''}${rotX}`;
      }
      if (direction & (DIRECTION_LEFT | DIRECTION_RIGHT)) {
        const rotY = direction & DIRECTION_LEFT ? -angle : angle;
        fromTimeline += `ry${rotY > 0 ? '+' : ''}${rotY}`;
      }
      if (!(direction & (DIRECTION_UP | DIRECTION_DOWN | DIRECTION_LEFT | DIRECTION_RIGHT))) {
        fromTimeline += `ry+${angle}`;
      }
      const perspectiveValue = tuning?.length === 2 ? lastTuning : 25;
      fromTimeline += `p+${perspectiveValue ?? 25}`;
    }

    if (animationType !== 3 && direction) {
      if (direction & DIRECTION_RIGHT) {
        fromTimeline += `tx-${firstTuning ?? defaultDelta}`;
      } else if (direction & DIRECTION_LEFT) {
        fromTimeline += `tx+${firstTuning ?? defaultDelta}`;
      }

      if (direction & DIRECTION_DOWN) {
        fromTimeline += `ty-${secondTuning ?? firstTuning ?? defaultDelta}`;
      } else if (direction & DIRECTION_UP) {
        fromTimeline += `ty+${secondTuning ?? firstTuning ?? defaultDelta}`;
      }
    }

    if (blur) {
      const blurValue =
        blur === true ? 0.625 : typeof blur === 'number' && !isNaN(blur) ? blur : 0.625;
      fromTimeline += `b+${blurValue}`;
    }

    return parseTimeline(fromTimeline, originalStyle, splitByNotItem);
  };

  // ============================================================================
  // Split Animation Setup
  // ============================================================================

  const setupSplit = (element, splitBy) => {
    const targets = [];

    // Split by child elements
    if (splitBy === 'item') {
      Array.from(element.children).forEach((child) => {
        child.__usalOriginals = {
          style: captureComputedStyle(child),
          innerHTML: null,
        };
        targets.push(child);
      });
      return targets;
    }

    // Split by text
    const createSpan = (content) => {
      const span = document.createElement('span');
      span.textContent = content;
      return span;
    };

    const text = element.textContent || '';
    const words = text.split(/(\s+)/);
    element.innerHTML = '';

    const wrapper = document.createElement('span');
    words.forEach((word) => {
      if (!word) return;

      if (/\s/.test(word)) {
        wrapper.appendChild(document.createTextNode(word));
        return;
      }
      const container = document.createElement('span');
      applyStyles(container, {
        [STYLE_DISPLAY]: CSS_INLINE_BLOCK,
        whiteSpace: 'nowrap',
      });

      let chars = [word];
      if (splitBy === 'letter') {
        if (typeof Intl !== 'undefined' && Intl.Segmenter) {
          const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
          chars = Array.from(segmenter.segment(word), (s) => s.segment);
        } else {
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

      wrapper.appendChild(container);
    });

    element.appendChild(wrapper);
    return targets;
  };

  // ============================================================================
  // Count Animation Setup
  // ============================================================================

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

    const wrapper = document.createElement('span');
    wrapper.appendChild(document.createTextNode(parts[0]));

    const span = document.createElement('span');
    wrapper.appendChild(span);

    wrapper.appendChild(document.createTextNode(parts[1]));

    element.innerHTML = '';
    element.appendChild(wrapper);

    data.countData = { value, decimals, original, span, thousandSep, decimalSep };
    return true;
  };

  const animateCount = (data, resolve) => {
    const { value, decimals, original, span, thousandSep, decimalSep } = data.countData;
    const duration = data.config[CONFIG_DURATION] ?? instance.config.defaults.duration;
    const delay = data.config[CONFIG_DELAY] ?? instance.config.defaults.delay;
    const easing = data.config[CONFIG_EASING] ?? instance.config.defaults.easing;
    let start = performance.now() + delay;

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
      if (data.stop) {
        resolve();
        return;
      }
      if (progress >= 1) {
        if (data.config[CONFIG_LOOP]) {
          start = performance.now() + delay;
          requestAnimationFrame(tick);
          return;
        }
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  // ============================================================================
  // Text Effects Animation
  // ============================================================================

  const animateTextEffect = (data, targets, type, duration, splitDelay, resolve) => {
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

    function checkStop() {
      if (data.stop) {
        animations.forEach((animation) => animation.cancel());
        animations.length = 0;
        resolve();
        return;
      }
      requestAnimationFrame(checkStop);
    }
    requestAnimationFrame(checkStop);
  };

  // ============================================================================
  // Main Animation Controller
  // ============================================================================

  const animate = (data) => {
    if (data.stop) return;
    data.hasAnimated = true;

    data.animating = new Promise((resolve) => {
      const { config, element, targets, countData, splitConfig } = data;

      const duration = config[CONFIG_DURATION] ?? instance.config.defaults.duration;
      const delay = config[CONFIG_DELAY] ?? instance.config.defaults.delay;
      const easing = config[CONFIG_EASING] ?? instance.config.defaults.easing;
      const forwards = config[CONFIG_FORWARDS] ?? instance.config.defaults.forwards;
      const splitDelay = splitConfig[CONFIG_DELAY] ?? instance.config.defaults.splitDelay;

      const originalStyle = element.__usalOriginals?.style;

      // Text effects
      if (config[CONFIG_TEXT]) {
        animateTextEffect(
          data,
          targets || [element],
          config[CONFIG_TEXT],
          duration,
          splitDelay,
          resolve
        );
        return;
      }

      // Count animation
      if (countData) {
        animateCount(data, resolve);
        return;
      }

      // Standard animation
      let options = {
        duration,
        delay,
        easing,
        fill: 'forwards',
      };

      if (config[CONFIG_LOOP]) options = { ...options, iterations: Infinity };

      const letsGo = (element, config, options, originalStyle, resolve) => {
        const keyframes = createKeyframes(config, originalStyle);
        if (forwards) originalStyle = keyframes[keyframes.length - 1];
        const animation = element.animate(keyframes, {
          ...options,
          id: genTmpId(),
        });
        animation.persist();

        let cleanup = () => {
          cleanup = () => {};
          cancelAllAnimations(data, element, originalStyle).then(() => resolve());
        };

        animation.onfinish = () => cleanup();

        function checkStop() {
          if (data.stop) {
            cleanup();
            return;
          }
          if (animation.playState === 'running') {
            requestAnimationFrame(checkStop);
          }
        }
        requestAnimationFrame(checkStop);
      };

      // Animate split elements or single element
      if (targets) {
        const animationPromises = targets.map((target, index) => {
          const targetOriginalStyle = target.__usalOriginals?.style || originalStyle;
          if (!targetOriginalStyle) {
            return Promise.resolve();
          }

          return new Promise((resolve) =>
            letsGo(
              target,
              data.splitConfig,
              {
                ...options,
                delay: delay + index * splitDelay,
              },
              targetOriginalStyle,
              resolve
            )
          );
        });
        Promise.all(animationPromises).then(() => resolve());
      } else {
        letsGo(element, config, options, originalStyle, resolve);
      }
    }).then(() => {
      data.onfinish();
      data.animating = null;
      data.stop = true;
    });
  };

  const animateIfVisible = (data, ratio = null) => {
    if (
      data.config[CONFIG_LOOP] ||
      data.animating !== null ||
      (data.hasAnimated && (data.config[CONFIG_ONCE] ?? instance.config.once))
    )
      return;

    const _ratio = ratio ?? calculateVisibilityRatio(data.element);

    if (data.stop && _ratio < 0.01) {
      resetStyle(data);
      return;
    }

    const threshold = Math.max(
      0,
      Math.min(1, (data.config[CONFIG_THRESHOLD] ?? instance.config.defaults.threshold) / 100)
    );

    if (_ratio >= threshold) {
      animate(data);
    }
  };

  // ============================================================================
  // Element Processing & Cleanup
  // ============================================================================

  const cleanupElement = (data) =>
    new Promise((resolve) => {
      data.onfinish = () => {
        data.onfinish = () => {};

        const splitByItem = data.config[CONFIG_SPLIT]?.includes('item');

        if (data.targets) {
          data.targets.forEach((target) => {
            if (target.__usalOriginals?.style) {
              applyStyles(target, target.__usalOriginals.style, true);
            }
          });
        }

        const innerHTML = data.element.__usalOriginals?.innerHTML;
        if (innerHTML && !splitByItem && (data.config[CONFIG_SPLIT] || data.countData)) {
          data.element.innerHTML = innerHTML;
        }

        if (data.element.__usalOriginals?.style) {
          applyStyles(data.element, data.element.__usalOriginals.style, true);
        }

        requestAnimationFrame(() => resolve());
      };

      if (data.animating === null) data.onfinish();
      else data.stop = true;
    });

  const processElement = (element, elementObserver) => {
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
        instance.elements.delete(element.__usalID);
        elementObserver.unobserve(element);
        cleanupElement(existing).then(() => {
          processElement(element, elementObserver);
        });
      }
      return;
    }

    element.__usalFragment = 1;
    const config = parseClasses(classes);

    const data = {
      element,
      config,
      splitConfig: [...config],
      configString: classes,
      targets: null,
      state: null,
      stop: false,
      hasAnimated: false,
      animating: null,
      countData: null,
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
      data.targets = setupSplit(element, splitBy);
      const splitOverrides = parseClasses(config[CONFIG_SPLIT]);
      data.splitConfig = config.map((value, index) => splitOverrides[index] ?? value);
    }

    // Reset Style initially
    resetStyle(data);

    instance.elements.set(element.__usalID, data);

    requestAnimationFrame(async () => {
      if (config[CONFIG_LOOP]) {
        animate(data);
      } else {
        animateIfVisible(data);
        elementObserver.observe(element);
      }
    });
  };

  // ============================================================================
  // Observers Setup
  // ============================================================================

  const setupObservers = () => {
    const domObservers = new Set();
    const resizeObservers = new Set();
    const observedDOMs = new Set();
    let lastScan = 0;
    let throttleOnTailTimer = null;

    const elementObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const data = instance.elements.get(
            entry.target.__usalID || entry.target.getAttribute(DATA_USAL_ID)
          );
          if (data) {
            animateIfVisible(data, entry.intersectionRatio);
          }
        }
      },
      { threshold: INTERSECTION_THRESHOLDS }
    );

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

    const scanAllDOMs = () => {
      // Clean disconnected elements
      instance.elements.forEach((data, id) => {
        if (!data.element.isConnected) {
          elementObserver.unobserve(data.element);
          cleanupElement(data).then(() => {
            instance.elements.delete(id);
          });
        } else {
          animateIfVisible(data);
        }
      });

      // Process new elements
      const allDOMs = collectAllDOMs();
      for (const dom of allDOMs) {
        if (!observedDOMs.has(dom)) {
          observeDOM(dom);
          observedDOMs.add(dom);
        }
        const elements = dom.querySelectorAll?.(DATA_USAL_SELECTOR);
        for (const element of elements) {
          processElement(element, elementObserver);
        }
      }
      lastScan = Date.now();
    };

    const handleObserverEvents = (events) => {
      const items = Array.isArray(events) ? events : [events];
      const hasUsalFragment = (target) => !!target.__usalFragment;

      let cancel = null;
      for (const item of items) {
        if (item.type === 'attributes') {
          const attrName = item.attributeName;
          if (attrName === DATA_USAL_ATTRIBUTE || attrName === DATA_USAL_ID) {
            processElement(item.target, elementObserver);
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

  // ============================================================================
  // Initialization
  // ============================================================================

  const autoInit = () => {
    if (!instance.initialized) {
      instance.initialized = true;
      instance.observers = setupObservers();
    }
  };

  // ============================================================================
  // Public API
  // ============================================================================

  const publicAPI = {
    config(newConfig = {}) {
      if (arguments.length === 0) return { ...instance.config };
      Object.assign(instance.config, newConfig);
      return publicAPI;
    },

    async destroy() {
      if (!instance.initialized) return Promise.resolve();
      if (instance.destroying != null) return instance.destroying;

      instance.observers();
      const elements = Array.from(instance.elements.values());

      instance.destroying = Promise.all(elements.map((data) => cleanupElement(data))).then(() => {
        instance.elements.clear();
        instance.observers = () => {};
        instance.initialized = false;
        instance.destroying = null;
      });

      return instance.destroying;
    },

    async restart() {
      if (instance.restarting != null) return instance.restarting;
      if (instance.destroying != null) return instance.destroying.then(() => publicAPI.restart());

      instance.restarting = publicAPI
        .destroy()
        .then(
          () =>
            new Promise((resolve) => {
              requestAnimationFrame(() => {
                if (document.readyState === 'loading') {
                  document.addEventListener(
                    'DOMContentLoaded',
                    () => {
                      autoInit();
                      resolve(publicAPI);
                    },
                    { once: true }
                  );
                } else {
                  autoInit();
                  resolve(publicAPI);
                }
              });
            })
        )
        .finally(() => {
          instance.restarting = null;
        });

      return instance.restarting;
    },

    initialized: () => instance.initialized,
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
