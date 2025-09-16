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
      loop: 'mirror',
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
  const CONFIG_STAGGER = 15;

  const DIRECTION_UP = 1;
  const DIRECTION_DOWN = 2;
  const DIRECTION_LEFT = 4;
  const DIRECTION_RIGHT = 8;

  const STYLE_OPACITY = 'opacity';
  const STYLE_TRANSFORM = 'transform';
  const STYLE_FILTER = 'filter';
  const STYLE_PERSPECTIVE = 'perspective';
  const STYLE_DISPLAY = 'display';
  const CSS_NONE = 'none';
  const CSS_INLINE_BLOCK = 'inline-block';

  const INTERSECTION_THRESHOLDS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
  const ANIMATION_TYPES = ['fade', 'zoomin', 'zoomout', 'flip', 'slide'];

  const SHIMMER_KEYFRAMES = Array.from({ length: 17 }, (_, i) => {
    const progress = i / 16;
    const wave = (Math.sin(progress * Math.PI * 2) + 1) / 2;

    return {
      opacity: 0.5 + wave * 0.5,
      filter: `brightness(${1 + wave * 0.3})`,
      offset: progress,
    };
  });

  const WEIGHT_KEYFRAMES = Array.from({ length: 17 }, (_, i) => {
    const progress = i / 16;
    const wave = (Math.sin(progress * Math.PI * 2) + 1) / 2;

    return {
      fontWeight: Math.round(100 + wave * 800).toString(),
      offset: progress,
    };
  });

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
            animation.effect = null;
            animation.timeline = null;
            if (originalStyle) {
              if (data?.config?.[CONFIG_SPLIT] && !data.config[CONFIG_SPLIT].includes('item'))
                originalStyle = {
                  ...originalStyle,
                  [STYLE_DISPLAY]: CSS_INLINE_BLOCK,
                };
              applyStyles(element, originalStyle);
            }
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
        data.targets().forEach(([target]) => {
          applyStyles(
            target,
            createKeyframes(
              data.splitConfig || data.config,
              target.__usalOriginals?.style || originalStyle
            )[0]
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

  const genEmptyConfig = () => {
    const config = new Array(16).fill(null);
    config[CONFIG_TUNING] = [];
    config[CONFIG_STAGGER] = 'index';
    return config;
  };

  const parseClasses = (classString) => {
    const config = genEmptyConfig();

    classString = classString.replace(/\/\/[^\n\r]*/g, '').replace(/\/\*.*?\*\//gs, '');
    classString = classString.toLowerCase().trim();

    classString = extractAndSetConfig('count', config, CONFIG_COUNT, classString);
    classString = extractAndSetConfig('easing', config, CONFIG_EASING, classString);
    classString = extractAndSetConfig('line', config, CONFIG_LINE, classString);

    const tokens = classString.split(/\s+/).filter(Boolean);

    for (const token of tokens) {
      const parts = token.split('-');
      const firstPart = parts[0];

      if (config[CONFIG_ANIMATION] === null) {
        config[CONFIG_ANIMATION] = extractAnimation(firstPart);
        if (config[CONFIG_ANIMATION] !== null) {
          config[CONFIG_DIRECTION] = extractDirection(parts[1]);
          config[CONFIG_TUNING] = parts
            .slice(1 + (config[CONFIG_DIRECTION] ? 1 : 0))
            .filter((item) => !isNaN(item) && item !== '')
            .map((item) => +item);
          continue;
        }
      }

      switch (token) {
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
            case 'loop':
              if (parts[1] === 'mirror' || parts[1] === 'jump') {
                config[CONFIG_LOOP] = parts[1];
              } else config[CONFIG_LOOP] = true;
              break;
            case 'text':
              if (parts[1] === 'shimmer' || parts[1] === 'fluid') {
                config[CONFIG_TEXT] = parts[1];
                config[CONFIG_LOOP] = 'jump';
              }
              break;
            case 'duration':
              if (parts[1]) config[CONFIG_DURATION] = +parts[1];
              break;
            case 'delay':
              if (parts[1]) config[CONFIG_DELAY] = +parts[1];
              if (parts[2]) config[CONFIG_STAGGER] = parts[2];
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
    const isSplitText = config[CONFIG_SPLIT] && !config[CONFIG_SPLIT]?.includes('item');
    if (config[CONFIG_LINE]) return parseTimeline(config[CONFIG_LINE], originalStyle, isSplitText);

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
    if (animationType === 4) fromTimeline = `o+${parseFloat(originalStyle[STYLE_OPACITY]) * 100}`;

    const defaultDelta = isSplitText ? 50 : 15;
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

    return parseTimeline(fromTimeline, originalStyle, isSplitText);
  };

  // ============================================================================
  // Split Animation Setup
  // ============================================================================
  function getStaggerFunction(targets, strategy = 'index') {
    const targetsData = targets.map((target) => {
      const rect = target.getBoundingClientRect();
      return {
        target,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    });

    const bounds = targetsData.reduce(
      (acc, item) => ({
        minX: Math.min(acc.minX, item.x),
        maxX: Math.max(acc.maxX, item.x),
        minY: Math.min(acc.minY, item.y),
        maxY: Math.max(acc.maxY, item.y),
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    const metrics = targetsData.map((item, index) => {
      let value;
      switch (strategy) {
        case 'linear':
          value = Math.hypot(item.x, item.y);
          break;
        case 'center':
          value = Math.hypot(item.x - centerX, item.y - centerY);
          break;
        case 'edges':
          value = Math.min(
            Math.abs(item.x - bounds.minX),
            Math.abs(item.x - bounds.maxX),
            Math.abs(item.y - bounds.minY),
            Math.abs(item.y - bounds.maxY)
          );
          break;
        case 'random':
          value = Math.random();
          break;
        default: // index
          value = index;
      }
      return value;
    });

    const min = Math.min(...metrics);
    const max = Math.max(...metrics);
    const range = max - min || 1;

    return (totalDuration = 1000, elementDuration = 50) => {
      if (elementDuration > totalDuration) {
        elementDuration = totalDuration;
      }

      const maxDelay = totalDuration - elementDuration;

      return targetsData.map((item, index) => {
        const normalizedValue = (metrics[index] - min) / range;

        const delay = normalizedValue * maxDelay;

        return [item.target, delay];
      });
    };
  }

  const setupSplit = (element, splitBy, strategy) => {
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
      return getStaggerFunction(targets, strategy);
    }

    // Split by text
    const createSpan = (content) => {
      const span = document.createElement('span');
      span.textContent = content;
      return span;
    };

    const processTextContent = (text) => {
      if (!text?.trim()) return text ? document.createTextNode(text) : null;

      const wrapper = document.createElement('span');
      const words = text.split(/(\s+)/);

      words.forEach((word) => {
        if (!word) return;

        if (/\s/.test(word)) {
          wrapper.appendChild(document.createTextNode(word));
          return;
        }

        // Split Word
        if (splitBy === 'word') {
          const span = createSpan(word);
          applyStyles(span, { [STYLE_DISPLAY]: CSS_INLINE_BLOCK });
          wrapper.appendChild(span);
          targets.push(span);
          return;
        }

        // Split letter
        const container = document.createElement('span');
        applyStyles(container, { [STYLE_DISPLAY]: CSS_INLINE_BLOCK, whiteSpace: 'nowrap' });

        let chars;
        if (typeof Intl !== 'undefined' && Intl.Segmenter) {
          const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
          chars = Array.from(segmenter.segment(word), (s) => s.segment);
        } else {
          chars = word.match(
            /\p{RI}\p{RI}|(?:\p{Emoji}(?:\u200D\p{Emoji})*)|(?:\P{M}\p{M}*)|./gsu
          ) || [word];
        }

        chars.forEach((char) => {
          const span = createSpan(char);
          container.appendChild(span);
          targets.push(span);
        });

        wrapper.appendChild(container);
      });

      return wrapper;
    };

    const processNode = (node, parent) => {
      const processed =
        node.nodeType === Node.TEXT_NODE
          ? processTextContent(node.textContent)
          : node.nodeType === Node.ELEMENT_NODE
            ? (() => {
                const clone = node.cloneNode(false);
                Array.from(node.childNodes).forEach((child) => processNode(child, clone));
                return clone;
              })()
            : null;

      if (processed) parent.appendChild(processed);
    };

    const fragment = document.createDocumentFragment();
    Array.from(element.childNodes).forEach((node) => processNode(node, fragment));

    element.innerHTML = '';
    element.appendChild(fragment);

    return getStaggerFunction(targets, strategy);
  };

  // ============================================================================
  // Count Animation Setup
  // ============================================================================

  const setupCount = (element, config, data) => {
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

    let span = null;

    const findAndReplace = (node) => {
      if (span) return;

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const index = text.indexOf(config[CONFIG_COUNT]);

        if (index !== -1) {
          const before = text.substring(0, index);
          const after = text.substring(index + config[CONFIG_COUNT].length);

          const fragment = document.createDocumentFragment();

          if (before) fragment.appendChild(document.createTextNode(before));

          span = document.createElement('span');
          span.textContent = original;
          fragment.appendChild(span);

          if (after) fragment.appendChild(document.createTextNode(after));

          node.parentNode.replaceChild(fragment, node);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        Array.from(node.childNodes).forEach(findAndReplace);
      }
    };

    findAndReplace(element);

    if (!span) return false;

    data.countData = { value, decimals, original, span, thousandSep, decimalSep };
    return true;
  };

  // ============================================================================
  // Count Animation
  // ============================================================================

  const animateCount = (countData, options) => {
    const { duration, easing, delay, iterations } = options;
    const { value, decimals, original, span, thousandSep, decimalSep } = countData;

    let startTime = null;
    let currentTime = 0;
    let playState = 'idle';
    let playbackRate = 1;
    let pausedTime = 0;
    let currentIteration = 0;

    const getEasingFunction = (easingType) => {
      switch (easingType) {
        case 'linear':
          return (t) => t;

        case 'ease':
          return (t) => {
            if (t === 0) return 0;
            if (t === 1) return 1;
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          };

        case 'ease-in':
          return (t) => t * t * t;

        case 'ease-out':
          return (t) => 1 - Math.pow(1 - t, 3);

        case 'ease-in-out':
          return (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

        default:
          return (t) => t;
      }
    };

    const easingFunction = getEasingFunction(easing);

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

    const updateValue = (time) => {
      const progress = Math.max(0, Math.min(1, time / duration));
      const easedProgress = easingFunction(progress);
      const currentValue = value * easedProgress;

      span.textContent = formatNumber(currentValue);

      if (progress >= 1) {
        span.textContent = original;

        if (iterations === Infinity || currentIteration < iterations - 1) {
          currentIteration++;
          currentTime = 0;
          pausedTime = 0;
          startTime = performance.now();
        } else {
          playState = 'finished';
        }
      } else if (progress <= 0 && playbackRate < 0) {
        span.textContent = formatNumber(0);

        if (iterations === Infinity || currentIteration < iterations - 1) {
          currentIteration++;
          currentTime = duration;
          pausedTime = duration;
          startTime = performance.now();
        } else {
          playState = 'finished';
        }
      }
    };

    return {
      tick() {
        if (playState === 'running') {
          const now = performance.now();
          const elapsed = now - startTime;

          if (playbackRate > 0) {
            currentTime = pausedTime + elapsed;
          } else {
            currentTime = pausedTime - elapsed;
          }

          if (iterations !== Infinity && currentIteration >= iterations - 1) {
            currentTime = Math.max(0, Math.min(duration, currentTime));
          }

          updateValue(currentTime);

          if (
            iterations !== Infinity &&
            currentIteration >= iterations - 1 &&
            ((playbackRate > 0 && currentTime >= duration) ||
              (playbackRate < 0 && currentTime <= 0))
          ) {
            playState = 'finished';
          }
        }
      },

      play() {
        if (playState === 'finished') {
          if (playbackRate > 0) {
            currentTime = 0;
            pausedTime = 0;
          } else {
            currentTime = duration;
            pausedTime = duration;
          }
          currentIteration = 0;
        } else if (playState === 'paused') {
          pausedTime = currentTime;
        } else if (playState === 'idle') {
          pausedTime = playbackRate > 0 ? 0 : duration;
          currentTime = pausedTime;
        }

        startTime = performance.now();
        playState = 'running';
      },

      pause() {
        if (playState === 'running') {
          pausedTime = currentTime;
          playState = 'paused';
        }
      },

      reset() {
        currentTime = 0;
        pausedTime = 0;
        playState = 'idle';
        startTime = null;
        currentIteration = 0;
        updateValue(0);
      },

      persist() {},

      effect: {
        getTiming() {
          return { duration, delay, easing, iterations };
        },
      },

      get playState() {
        return playState;
      },

      get currentTime() {
        return currentTime;
      },

      set currentTime(time) {
        currentTime = Math.max(0, Math.min(duration, time));
        pausedTime = currentTime;
        updateValue(currentTime);
        if (playState === 'finished') {
          playState = 'paused';
        }
      },

      get playbackRate() {
        return playbackRate;
      },

      set playbackRate(rate) {
        if (playState === 'paused') {
          pausedTime = currentTime;
        }
        playbackRate = rate;
      },
    };
  };
  // ============================================================================
  // Animation Controller
  // ============================================================================

  class AnimationController {
    reset() {
      this.rafId = null;
      this.animations = new Map();
    }

    constructor(data) {
      this.data = data;
      this.reset();
    }

    add(element, config, delay, originalStyle) {
      const duration = this.data.config[CONFIG_DURATION] ?? instance.config.defaults.duration;
      const easing = this.data.config[CONFIG_EASING] ?? instance.config.defaults.easing;
      const forwards = this.data.config[CONFIG_FORWARDS] ?? instance.config.defaults.forwards;
      const loop =
        this.data.config[CONFIG_LOOP] === true
          ? (instance.config.defaults.loop ?? 'mirror')
          : this.data.config[CONFIG_LOOP];

      // Standard animation
      let options = {
        duration,
        delay,
        easing,
        fill: 'forwards',
      };

      if (loop === 'jump') options.iterations = Infinity;

      let keyframes = [];
      if (this.data.config[CONFIG_TEXT]) {
        options = {
          duration: duration,
          iterations: Infinity,
          delay: delay,
          easing: 'linear',
          iterationStart: 0.5,
        };
        keyframes =
          this.data.config[CONFIG_TEXT] === 'shimmer' ? SHIMMER_KEYFRAMES : WEIGHT_KEYFRAMES;
      } else {
        keyframes = createKeyframes(config, originalStyle);
      }

      if (forwards) originalStyle = keyframes[keyframes.length - 1];

      const animation = this.data.countData
        ? animateCount(this.data.countData, options)
        : element.animate(keyframes, {
            ...options,
            id: genTmpId(),
          });

      animation.persist();
      animation.pause();

      this.animations.set(animation, {
        animation,
        element,
        delay,
        originalStyle,
        loop,
        playbackRate: -1,
        waiting: true,
      });
    }

    letsGo() {
      const { element, config, targets, splitConfig } = this.data;
      const delay = config[CONFIG_DELAY] ?? instance.config.defaults.delay;
      const duration = config[CONFIG_DURATION] ?? instance.config.defaults.duration;
      const originalStyle = element.__usalOriginals?.style;
      const splitDelay = splitConfig[CONFIG_DELAY] ?? instance.config.defaults.splitDelay;

      let notReadYet = targets?.()?.length || (originalStyle ? 0 : 1);

      if (targets) {
        targets(duration, splitDelay).forEach(([target, delay]) => {
          const targetOriginalStyle = target.__usalOriginals?.style || originalStyle;
          if (!targetOriginalStyle) return;
          notReadYet--;
          this.add(target, this.data.splitConfig, parseInt(delay), targetOriginalStyle);
        });
      } else if (originalStyle) {
        this.add(element, config, delay, originalStyle);
      }

      if (notReadYet === 0 && !this.rafId) {
        this.tick();
      }
    }

    timeToSayGoodbye() {
      if (this.animations.size !== 0) return false;
      this.reset();
      cancelAnimationFrame(this.rafId);
      this.data.resolve();
      return true;
    }

    tick() {
      const { toCleanup, toAnimate } = this.prepare();

      this.cleanupAnimation(toCleanup);

      this.animate(toAnimate);

      if (!this.timeToSayGoodbye()) {
        this.rafId = requestAnimationFrame(() => this.tick());
      }
    }

    prepare() {
      const toCleanup = [];
      const toAnimate = [];

      for (const [animation, info] of this.animations) {
        if (this.data.stop) {
          toCleanup.push([animation, info]);
          continue;
        }

        animation.tick?.();

        if (info.loop !== 'mirror') {
          if (animation.playState === 'finished') {
            toCleanup.push([animation, info]);
            continue;
          }
        } else {
          const duration = animation.effect.getTiming().duration;
          if (typeof duration === 'number' && duration > 0) {
            const progress = animation.currentTime / duration;

            if (
              !isNaN(progress) &&
              isFinite(progress) &&
              !info.waiting &&
              ((progress >= 0.95 && info.playbackRate > 0) ||
                (progress <= 0.05 && info.playbackRate < 0))
            ) {
              animation.pause();
              info.waiting = true;
            }
          }
        }
        toAnimate.push(info);
      }

      return { toCleanup, toAnimate };
    }

    animate(toAnimate) {
      if (toAnimate.length > 0 && toAnimate.every((info) => info.waiting)) {
        const currentDirection = toAnimate[0].playbackRate;
        if (currentDirection > 0) {
          toAnimate.sort((a, b) => b.delay - a.delay);
        } else {
          toAnimate.sort((a, b) => a.delay - b.delay);
        }

        toAnimate.forEach((next) => {
          next.waiting = false;
          next.playbackRate = -currentDirection;
          next.animation.playbackRate = next.playbackRate;
          next.animation.play();
        });
      }
    }

    cleanupAnimation(toCleanup) {
      toCleanup.forEach(([animation, info]) => {
        const clean = () => {
          this.animations.delete(animation);
          this.timeToSayGoodbye();
        };
        if (this.data.countData) clean();
        else
          cancelAllAnimations(this.data, info.element, info.originalStyle).then(() => {
            clean();
          });
      });
    }
  }

  // ============================================================================
  // Main Animation Controller
  // ============================================================================

  const animate = (data) => {
    if (data.stop) return;
    data.hasAnimated = true;

    data.animating = new Promise((resolve) => {
      data.resolve = resolve;
      data.controller.letsGo();
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
          data.targets().forEach(([target]) => {
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
      controller: null,
      resolve: () => {},
    };

    data.controller = new AnimationController(data);

    // Setup special animations
    if (config[CONFIG_COUNT]) {
      setupCount(element, config, data);
    }

    const splitBy = config[CONFIG_SPLIT]?.split(' ').find((item) =>
      ['word', 'letter', 'item'].includes(item)
    );
    if (splitBy) {
      data.targets = setupSplit(element, splitBy, config[CONFIG_STAGGER]);
      const splitOverrides = parseClasses(config[CONFIG_SPLIT]);
      const emptyConfig = genEmptyConfig();
      data.splitConfig = config.map((value, index) => {
        const override = splitOverrides[index];
        const empty = emptyConfig[index];
        if (Array.isArray(override) && Array.isArray(empty)) {
          return override.length > 0 ? override : value;
        }
        return override !== empty ? override : value;
      });
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
