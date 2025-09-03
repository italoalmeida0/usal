"use client";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/integrations/react.js
var react_exports = {};
__export(react_exports, {
  USALProvider: () => USALProvider,
  createUSAL: () => createUSAL,
  default: () => react_default,
  useUSAL: () => useUSAL
});
module.exports = __toCommonJS(react_exports);
var import_react = require("react");

// src/usal.js
var USAL = (() => {
  if (typeof window === "undefined") {
    const noop = () => ({});
    return {
      config: noop,
      destroy: noop,
      createInstance: () => ({ config: noop, destroy: noop })
    };
  }
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
  const ANIMATION_FADE = 0;
  const ANIMATION_ZOOMIN = 1;
  const ANIMATION_ZOOMOUT = 2;
  const ANIMATION_FLIP = 3;
  const animationMap = { fade: 0, zoomin: 1, zoomout: 2, flip: 3 };
  const DIRECTION_UP = 1;
  const DIRECTION_DOWN = 2;
  const DIRECTION_LEFT = 4;
  const DIRECTION_RIGHT = 8;
  const EASING_EASE_OUT = 0;
  const EASING_LINEAR = 1;
  const EASING_EASE = 2;
  const EASING_EASE_IN = 3;
  const defaults = {
    maxConcurrent: 100,
    duration: 1e3,
    delay: 0,
    threshold: 30,
    splitDelay: 30,
    once: false
  };
  const $ = (element, styles) => Object.assign(element.style, styles);
  const parseClasses = (str) => {
    const tokens = str.trim().split(/\s+/);
    const parsedConfig = [
      ANIMATION_FADE,
      0,
      defaults.duration,
      defaults.delay,
      defaults.threshold,
      defaults.splitDelay,
      EASING_EASE_OUT,
      0,
      0,
      null,
      null,
      null,
      null
    ];
    tokens.forEach((token) => {
      const parts = token.split("-");
      const first = parts[0];
      if (animationMap[first] !== void 0) {
        parsedConfig[ANIMATION] = animationMap[first];
        if (parts[1]) {
          let direction = 0;
          for (const char of parts[1]) {
            direction |= char === "u" ? DIRECTION_UP : char === "d" ? DIRECTION_DOWN : char === "l" ? DIRECTION_LEFT : char === "r" ? DIRECTION_RIGHT : 0;
          }
          parsedConfig[DIRECTION] = direction;
        }
      } else if (first === "split") {
        const second = parts[1];
        if (["word", "letter", "item"].includes(second)) {
          parsedConfig[SPLIT] = second;
        } else if (second === "delay" && parts[2]) {
          parsedConfig[SPLIT_DELAY] = +parts[2];
        } else {
          parsedConfig[SPLIT_ANIMATION] = token.substring(6);
        }
      } else if (first === "text" && ["shimmer", "fluid"].includes(parts[1])) {
        parsedConfig[TEXT] = parts[1];
      } else if (token.startsWith("count-[") && token.endsWith("]")) {
        parsedConfig[COUNT] = token.slice(7, -1);
      } else if (parts[1] && !isNaN(+parts[1])) {
        const value = +parts[1];
        if (first === "duration") parsedConfig[DURATION] = value;
        else if (first === "delay") parsedConfig[DELAY] = value;
        else if (first === "threshold") parsedConfig[THRESHOLD] = value;
      } else if (token === "blur") {
        parsedConfig[BLUR] = 1;
      } else if (token === "once") {
        parsedConfig[ONCE] = 1;
      } else if (token === "linear") {
        parsedConfig[EASING] = EASING_LINEAR;
      } else if (token === "ease") {
        parsedConfig[EASING] = EASING_EASE;
      } else if (token === "ease-in") {
        parsedConfig[EASING] = EASING_EASE_IN;
      }
    });
    return parsedConfig;
  };
  const easings = [
    (t) => 1 - Math.pow(1 - t, 3),
    // ease-out
    (t) => t,
    // linear
    (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    // ease
    (t) => t * t * t
    // ease-in
  ];
  const getTransform = (animation, direction, progress) => {
    const inverse = 1 - progress;
    const isFlip = animation === ANIMATION_FLIP;
    let transform = "";
    if (animation === ANIMATION_ZOOMIN) {
      transform = `scale(${0.6 + progress * 0.4})`;
    } else if (animation === ANIMATION_ZOOMOUT) {
      transform = `scale(${1.2 - progress * 0.2})`;
    } else if (isFlip) {
      const value = inverse * (direction && direction !== DIRECTION_UP && direction !== DIRECTION_DOWN && direction !== DIRECTION_LEFT && direction !== DIRECTION_RIGHT ? 45 : 90);
      const parts = [];
      if (direction & (DIRECTION_UP | DIRECTION_DOWN)) {
        parts.push(`rotateX(${direction & DIRECTION_UP ? value : -value}deg)`);
      }
      if (direction & (DIRECTION_LEFT | DIRECTION_RIGHT)) {
        parts.push(
          `rotateY(${direction & DIRECTION_LEFT ? -value : value}deg)`
        );
      }
      if (!parts.length && isFlip) {
        parts.push(`rotateY(${inverse * 90}deg)`);
      }
      transform = parts.length ? `perspective(400px) ${parts.join(" ")}` : "";
    }
    if (!isFlip && direction) {
      const value = inverse * 30;
      const x = direction & DIRECTION_RIGHT ? -value : direction & DIRECTION_LEFT ? value : 0;
      const y = direction & DIRECTION_DOWN ? -value : direction & DIRECTION_UP ? value : 0;
      if (x || y) {
        transform += ` translate(${x}px, ${y}px)`;
      }
    }
    return [progress, transform || "none"];
  };
  const setupCount = (element, config, data) => {
    const text = element.textContent || "";
    const parts = text.split(config[COUNT]);
    if (parts.length !== 2) return false;
    const clean = config[COUNT].replace(/[^\d\s,.]/g, "");
    let decimals = 0, value = 0;
    const nums = clean.replace(/[^\d.]/g, ".");
    const lastDot = nums.lastIndexOf(".");
    if (lastDot > -1) {
      const after = nums.substring(lastDot + 1);
      if (after.length <= 2) {
        decimals = after.length;
        value = parseFloat(nums);
      } else {
        value = parseFloat(nums.replace(/\./g, ""));
      }
    } else {
      value = parseFloat(clean.replace(/\D/g, ""));
    }
    const span = document.createElement("span");
    span.textContent = "0";
    span.style.cssText = "display:inline;visibility:visible";
    element.innerHTML = "";
    element.appendChild(document.createTextNode(parts[0]));
    element.appendChild(span);
    element.appendChild(document.createTextNode(parts[1]));
    data.countData = [value, decimals, config[COUNT]];
    data.countSpan = span;
    return true;
  };
  const formatNumber = (value, original, decimals) => {
    let formatted = decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toString();
    if (original.includes(" ") || original.includes(",")) {
      const parts = formatted.split(".");
      parts[0] = parts[0].replace(
        /\B(?=(\d{3})+(?!\d))/g,
        // Regex for thousand grouping
        original.includes(" ") ? " " : ","
      );
      formatted = parts.join(decimals > 0 ? "." : "");
    }
    return formatted;
  };
  const processElement = (element, instance) => {
    let id = element.getAttribute("data-usal-id");
    if (!id) {
      id = `u${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
      element.setAttribute("data-usal-id", id);
    }
    const existing = instance.elements.get(id);
    if (existing?.rafId) {
      cancelAnimationFrame(existing.rafId);
      instance.animating.delete(element);
    }
    const classes = element.getAttribute("data-usal") || "";
    const config = parseClasses(classes);
    const data = {
      element,
      config,
      configString: classes,
      original: {
        opacity: element.style.opacity || "",
        transform: element.style.transform || "",
        filter: element.style.filter || ""
      },
      targets: null,
      // For split animations
      animated: 0,
      rafId: null
    };
    if (config[COUNT]) setupCount(element, config, data);
    if (config[SPLIT]) {
      const targets = [];
      if (config[SPLIT] === "item") {
        Array.from(element.children).forEach((child) => {
          child.style.opacity = config[TEXT] ? "1" : "0";
          targets.push(child);
        });
      } else {
        const isWord = config[SPLIT] === "word";
        const text = element.textContent || "";
        element.innerHTML = "";
        const parts = isWord ? text.split(/(\s+)/) : text.split("");
        parts.forEach((part) => {
          if (!part) return;
          if (/\s/.test(part)) {
            element.appendChild(document.createTextNode(part));
          } else {
            const span = document.createElement("span");
            span.textContent = part;
            span.style.cssText = `display:inline-block;opacity:${config[TEXT] ? "1" : "0"}`;
            element.appendChild(span);
            targets.push(span);
          }
        });
      }
      data.targets = targets;
      if (config[SPLIT_ANIMATION])
        data.splitConfig = parseClasses(config[SPLIT_ANIMATION]);
    }
    if (!config[TEXT] && !data.countSpan && !data.targets) {
      $(element, { opacity: "0" });
    }
    instance.elements.set(id, data);
    return data;
  };
  const animate = (ratio, data, instance) => {
    if (data.animated || ratio < getThreshold(data) || instance.animating.has(data.element) || instance.animating.size >= instance.config.maxConcurrent) return;
    instance.animating.add(data.element);
    const { config, element, targets, countSpan, countData } = data;
    if (!config[TEXT] && !countSpan && !targets) {
      const [, transform] = getTransform(
        config[ANIMATION],
        config[DIRECTION],
        0
      );
      $(element, {
        opacity: "0",
        transform: transform !== "none" ? transform : "translateZ(0)",
        filter: config[BLUR] ? "blur(10px)" : "",
        willChange: "transform,opacity"
      });
    }
    const start = performance.now() + config[DELAY];
    const easing = easings[config[EASING]];
    const splitConfig = targets && config[SPLIT_ANIMATION] ? parseClasses(config[SPLIT_ANIMATION]) : config;
    if (config[TEXT]) {
      const textTargets = targets || [element];
      const startTime = performance.now();
      const tick2 = () => {
        const elapsed = performance.now() - startTime;
        const cycle = elapsed % config[DURATION] / config[DURATION];
        textTargets.forEach((target, index) => {
          if (config[TEXT] === "shimmer") {
            const phase = cycle * Math.PI * 2 + index * 0.5;
            const intensity = Math.sin(phase) * 0.5 + 0.5;
            $(target, {
              opacity: 0.5 + intensity * 0.5,
              filter: `brightness(${1 + intensity * 0.3})`
            });
          } else {
            const wave = cycle * 1.6 - 0.3;
            const position = index / textTargets.length;
            const distance = Math.abs(wave - position);
            const intensity = distance < 0.3 ? 1 - distance / 0.3 : 0;
            $(target, {
              fontWeight: Math.round(100 + intensity * 800).toString(),
              opacity: "1"
            });
          }
        });
        data.rafId = requestAnimationFrame(tick2);
      };
      tick2();
      data.animated = 1;
      return;
    }
    const tick = () => {
      const elapsed = Math.max(0, performance.now() - start);
      const progress = Math.min(elapsed / config[DURATION], 1);
      const eased = easing(progress);
      if (countSpan && countData) {
        countSpan.textContent = progress >= 1 ? countData[2] : formatNumber(countData[0] * eased, countData[2], countData[1]);
      }
      const applyAnimation = (el, animProgress, animConfig) => {
        const [, transform] = getTransform(
          animConfig[ANIMATION],
          animConfig[DIRECTION],
          animProgress
        );
        $(el, {
          opacity: animProgress.toString(),
          transform: transform !== "none" ? transform : "translateZ(0)",
          filter: config[BLUR] && animProgress < 1 ? `blur(${(1 - animProgress) * 10}px)` : "",
          willChange: animProgress < 1 ? "transform,opacity" : "auto"
          // AQUI - usar animProgress!
        });
      };
      if (targets) {
        let done = true;
        targets.forEach((target, index) => {
          const targetDelay = index * config[SPLIT_DELAY];
          const targetElapsed = elapsed - targetDelay;
          if (targetElapsed < 0) {
            done = false;
            return;
          }
          const targetProgress = Math.min(targetElapsed / config[DURATION], 1);
          const targetEased = easing(targetProgress);
          applyAnimation(target, targetEased, splitConfig);
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
    const { element, targets, countSpan, original } = data;
    if (!data.config[TEXT] && !countSpan && !targets) {
      $(element, { opacity: "0", transform: "", filter: "" });
    } else {
      $(element, {
        opacity: original.opacity,
        transform: original.transform,
        filter: original.filter
      });
    }
    if (countSpan) countSpan.textContent = "0";
    if (targets) {
      targets.forEach(
        (target) => $(target, { opacity: "0", transform: "", filter: "" })
      );
    }
    if (!data.config[ONCE] && !instance.config.once) data.animated = 0;
    instance.animating.delete(element);
  };
  const getThreshold = (data) => {
    return Math.max(0, Math.min(
      1,
      (data.config[THRESHOLD] || defaults.threshold) / 100
    ));
  };
  const newElement = (element, instance) => {
    const data = processElement(element, instance);
    if (instance.observer) {
      instance.observer.observe(element);
      const rect = element.getBoundingClientRect();
      const visible = rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;
      if (visible) {
        const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
        const visibleWidth = Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0);
        const visibleArea = visibleHeight * visibleWidth;
        const totalArea = rect.height * rect.width;
        const ratio = visibleArea / totalArea;
        animate(ratio, data, instance);
      }
    }
  };
  const handleElement = (element, instance, action = "add") => {
    const id = element.getAttribute("data-usal-id");
    if (action === "remove") {
      if (!id) return;
      const data = instance.elements.get(id);
      if (!data) return;
      if (data.rafId) cancelAnimationFrame(data.rafId);
      if (instance.observer) instance.observer.unobserve(element);
      instance.elements.delete(id);
      instance.animating.delete(element);
      return;
    }
    if (action === "update") {
      const newClasses = element.getAttribute("data-usal");
      if (!newClasses) {
        handleElement(element, instance, "remove");
        return;
      }
      if (id && instance.elements.has(id)) {
        const data = instance.elements.get(id);
        if (newClasses !== data.configString) {
          reset(data, instance);
          instance.elements.delete(id);
          element.removeAttribute("data-usal-id");
          newElement(element, instance);
        }
      } else {
        handleElement(element, instance, "add");
      }
      return;
    }
    if (id && instance.elements.has(id)) return;
    newElement(element, instance);
  };
  const setupObservers = (instance) => {
    if (instance.observer) instance.observer.disconnect();
    if (instance.mutationObserver) instance.mutationObserver.disconnect();
    instance.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const data = instance.elements.get(
            entry.target.getAttribute("data-usal-id")
          );
          if (!data) return;
          if (entry.intersectionRatio === 0 && data.animated && !data.config[ONCE] && !instance.animating.has(data.element)) reset(data, instance);
          else animate(entry.intersectionRatio, data, instance);
        });
      },
      // Multiple thresholds for smooth detection
      { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] }
    );
    instance.elements.forEach(
      (data) => instance.observer.observe(data.element)
    );
    instance.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              if (node.hasAttribute("data-usal")) handleElement(node, instance);
              node.querySelectorAll?.("[data-usal]")?.forEach((element) => handleElement(element, instance));
            }
          });
          mutation.removedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              if (node.hasAttribute("data-usal"))
                handleElement(node, instance, "remove");
              node.querySelectorAll?.("[data-usal]")?.forEach(
                (element) => handleElement(element, instance, "remove")
              );
            }
          });
        } else if (mutation.type === "attributes" && mutation.attributeName === "data-usal") {
          handleElement(mutation.target, instance, "update");
        }
      });
    });
    instance.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-usal"]
    });
  };
  const createInstance = (config = {}) => {
    let destroyTimeout;
    const instance = {
      initialized: false,
      observer: null,
      mutationObserver: null,
      elements: /* @__PURE__ */ new Map(),
      // Track all animated elements
      animating: /* @__PURE__ */ new Set(),
      // Currently animating elements
      config: { ...defaults, ...config }
    };
    return {
      init(newConfig = {}) {
        if (instance.initialized) return;
        instance.initialized = true;
        Object.assign(instance.config, newConfig);
        instance.observer = new IntersectionObserver(() => {
        });
        document.querySelectorAll("[data-usal]").forEach((element) => handleElement(element, instance));
        setupObservers(instance);
      },
      destroy() {
        clearTimeout(destroyTimeout);
        destroyTimeout = setTimeout(() => {
          [instance.observer, instance.mutationObserver].forEach(
            (observer) => observer?.disconnect()
          );
          instance.elements.forEach((data) => {
            if (data.rafId) cancelAnimationFrame(data.rafId);
            if (data.element?.parentNode) {
              $(data.element, data.original);
              data.element.removeAttribute("data-usal-id");
            }
          });
          instance.elements.clear();
          instance.animating.clear();
          instance.initialized = false;
          instance.observer = null;
          instance.mutationObserver = null;
        }, 0);
      },
      createInstance: () => createInstance(config)
    };
  };
  const globalInstance = createInstance();
  return { ...globalInstance, createInstance };
})();
if (typeof window !== "undefined" && !window.USAL) {
  window.USAL = USAL;
  const init = () => USAL.init();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    requestAnimationFrame(init);
  }
}
var usal_default = typeof window !== "undefined" && window.USAL || USAL;

// src/integrations/react.js
var import_jsx_runtime = require("react/jsx-runtime");
var USALContext = (0, import_react.createContext)(null);
var USALProvider = ({ children, config = {} }) => {
  const instanceRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    if (!instanceRef.current) {
      instanceRef.current = usal_default.createInstance();
      if (Object.keys(config).length > 0) {
        instanceRef.current.config(config);
      }
    }
    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
      }
    };
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(USALContext.Provider, { value: instanceRef.current, children });
};
var useUSAL = () => {
  const contextInstance = (0, import_react.useContext)(USALContext);
  const instanceRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    const instance = contextInstance || usal_default.createInstance();
    if (!instanceRef.current) {
      instanceRef.current = instance;
    }
    return () => {
      if (!contextInstance && instanceRef.current) {
        instanceRef.current.destroy();
      }
    };
  }, [contextInstance]);
  return {
    getInstance: () => instanceRef.current,
    config: (v) => instanceRef.current?.config(v),
    destroy: () => instanceRef.current?.destroy()
  };
};
var createUSAL = (config = {}) => {
  const instance = usal_default.createInstance();
  if (config && Object.keys(config).length > 0) {
    instance.config(config);
  }
  return {
    config: (v) => instance.config(v),
    destroy: () => instance.destroy(),
    getInstance: () => instance
  };
};
var react_default = usal_default;
