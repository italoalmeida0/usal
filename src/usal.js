const USAL = (() => {
  const state = {
    observer: null,
    mutationObserver: null,
    elements: new Map(),
    animating: new Set(),
    config: {
      maxConcurrent: 100,
      defaultDuration: 1000,
      defaultDelay: 0,
      defaultThreshold: 30,
      defaultSplitDelay: 30,
    },
  }

  const parseClasses = (str, instance) => {
    const tokens = str.trim().split(/\s+/)
    const parsed = {
      animation: "fade",
      direction: "",
      duration: instance.config.defaultDuration,
      delay: instance.config.defaultDelay,
      threshold: instance.config.defaultThreshold,
      splitDelay: instance.config.defaultSplitDelay,
      easing: "ease-out",
      blur: false,
      once: false,
      split: null,
      splitAnimation: null,
      count: null,
      text: null,
    }

    tokens.forEach((token) => {
      const parts = token.split("-")
      const first = parts[0]
      const second = parts[1]

      if (["fade", "zoomin", "zoomout", "flip"].includes(first)) {
        parsed.animation = first
        if (second) {
          const map = { u: "up", d: "down", l: "left", r: "right" }
          parsed.direction = second
            .split("")
            .map((d) => map[d])
            .join("-")
        }
      } else if (first === "split") {
        if (["word", "letter", "item"].includes(second)) {
          parsed.split = second
        } else if (second === "delay" && parts[2]) {
          parsed.splitDelay = parseInt(parts[2])
        } else {
          parsed.splitAnimation = parts.slice(1).join("-")
        }
      } else if (first === "text" && ["shimmer", "fluid"].includes(second)) {
        parsed.text = second
      } else if (token.startsWith("count-[") && token.endsWith("]")) {
        parsed.count = token.slice(7, -1)
      } else if (second && !isNaN(parseInt(second))) {
        if (first === "duration") parsed.duration = parseInt(second)
        else if (first === "delay") parsed.delay = parseInt(second)
        else if (first === "threshold") parsed.threshold = parseInt(second)
      } else if (token === "blur") parsed.blur = true
      else if (token === "once") parsed.once = true
      else if (["linear", "ease", "ease-in", "ease-out"].includes(token)) {
        parsed.easing = token
      }
    })

    return parsed
  }

  const easings = {
    linear: (t) => t,
    ease: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    "ease-in": (t) => t * t * t,
    "ease-out": (t) => 1 - Math.pow(1 - t, 3),
  }

  const getTransform = (animation, direction, progress) => {
    const t = progress
    const i = 1 - t

    const calc = (type) => {
      if (!direction) return type === "flip" ? `rotateY(${i * 90}deg)` : ""

      const v =
        i *
        (type === "flip" && direction.length > 1
          ? 45
          : type === "flip"
            ? 90
            : 30)

      if (type === "flip") {
        const x = direction.includes("u") ? v : direction.includes("d") ? -v : 0
        const y = direction.includes("l") ? -v : direction.includes("r") ? v : 0
        return [x && `rotateX(${x}deg)`, y && `rotateY(${y}deg)`]
          .filter(Boolean)
          .join(" ")
      }

      const x = direction.includes("r") ? -v : direction.includes("l") ? v : 0
      const y = direction.includes("d") ? -v : direction.includes("u") ? v : 0
      return x || y ? `translate(${x}px, ${y}px)` : ""
    }

    const base =
      {
        fade: "",
        zoomin: `scale(${0.6 + t * 0.4})`,
        zoomout: `scale(${1.2 - t * 0.2})`,
        flip: `perspective(400px) ${calc("flip")}`,
      }[animation] || ""

    const offset = animation !== "flip" ? calc("offset") : ""
    const transform = [base, offset].filter(Boolean).join(" ") || "none"

    return [t, transform]
  }

  const applyStyles = (el, styles) => Object.assign(el.style, styles)

  const isVisible = (el) => {
    const rect = el.getBoundingClientRect()
    return rect.top < window.innerHeight && rect.bottom > 0
  }

  const processElement = (element, instance) => {
    let id = element.getAttribute("data-usal-id")
    if (!id) {
      id = `usal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      element.setAttribute("data-usal-id", id)
    }

    const classes = element.getAttribute("data-usal") || ""
    const config = parseClasses(classes, instance)

    const data = {
      element,
      config,
      configString: classes,
      original: ["opacity", "transform", "filter"].reduce(
        (acc, prop) => ({ ...acc, [prop]: element.style[prop] || "" }),
        {},
      ),
      targets: null,
      animated: false,
      rafId: null,
    }

    if (config.count) {
      const text = element.textContent
      const parts = text.split(config.count)

      if (parts.length === 2) {
        let cleanValue = config.count.trim()
        cleanValue = cleanValue.replace(/[^\d\s,.]/g, "")

        let decimals = 0
        let value = 0

        const hasComma = cleanValue.includes(",")
        const hasDot = cleanValue.includes(".")
        const hasSpace = cleanValue.includes(" ")
        const separatorCount = [hasComma, hasDot, hasSpace].filter(
          Boolean,
        ).length

        if (separatorCount >= 2) {
          const lastComma = cleanValue.lastIndexOf(",")
          const lastDot = cleanValue.lastIndexOf(".")

          let decimalIndex = lastComma > lastDot ? lastComma : lastDot

          const integerPart = cleanValue.substring(0, decimalIndex)
          const decimalPart = cleanValue.substring(decimalIndex + 1)

          const decimalDigits = decimalPart.replace(/\D/g, "")
          decimals = decimalDigits.length

          const integerDigits = integerPart.replace(/\D/g, "")
          value = parseFloat(integerDigits + "." + decimalDigits)
        } else if (separatorCount === 1 && (hasComma || hasDot)) {
          const index = hasComma
            ? cleanValue.lastIndexOf(",")
            : cleanValue.lastIndexOf(".")
          const afterSeparator = cleanValue.substring(index + 1)

          if (afterSeparator.length <= 2 && /^\d+$/.test(afterSeparator)) {
            const beforeSeparator = cleanValue.substring(0, index)
            decimals = afterSeparator.length
            value = parseFloat(
              beforeSeparator.replace(/\D/g, "") + "." + afterSeparator,
            )
          } else {
            value = parseFloat(cleanValue.replace(/\D/g, ""))
            decimals = 0
          }
        } else {
          value = parseFloat(cleanValue.replace(/\D/g, ""))
          decimals = 0
        }

        data.countData = {
          value,
          decimals,
          original: config.count,
          before: parts[0],
          after: parts[1],
        }

        element.textContent = ""
        element.appendChild(document.createTextNode(parts[0]))
        const span = document.createElement("span")
        span.textContent = "0"
        element.appendChild(span)
        element.appendChild(document.createTextNode(parts[1]))
        data.countSpan = span
      }
    }

    if (config.split) {
      const targets = []

      if (config.split === "item") {
        Array.from(element.children).forEach((child) => {
          child.style.opacity = "0"
          if (config.text) {
            child.style.opacity = "1"
          }
          targets.push(child)
        })
      } else {
        const isWord = config.split === "word"

        const tempDiv = document.createElement("div")
        tempDiv.innerHTML = element.innerHTML

        const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT)
        const textNodes = []
        while (walker.nextNode()) {
          textNodes.push({
            text: walker.currentNode.textContent,
            parent: walker.currentNode.parentNode,
          })
        }

        element.innerHTML = ""

        textNodes.forEach(({ text }) => {
          if (!text.trim()) {
            element.appendChild(document.createTextNode(text))
            return
          }

          const parts = isWord ? text.split(/(\s+)/) : text.split("")

          parts.forEach((part) => {
            if (!part) return

            if (/\s/.test(part)) {
              element.appendChild(document.createTextNode(part))
            } else {
              const span = document.createElement("span")
              span.textContent = part
              span.style.display = "inline-block"
              span.style.opacity = "0"

              if (config.text) {
                span.style.opacity = "1"
              }
              element.appendChild(span)
              targets.push(span)
            }
          })
        })
      }

      data.targets = targets

      if (config.splitAnimation) {
        data.splitAnimationParsed = parseClasses(config.splitAnimation, instance)
      }
    }

    if (!config.text && !data.countSpan && !data.targets) {
      const [opacity, transform] = getTransform(
        config.animation,
        config.direction,
        0,
      )
      applyStyles(element, {
        opacity,
        transform: transform !== "none" ? transform : "",
        filter: config.blur ? "blur(10px)" : "",
      })
    }

    instance.elements.set(id, data)
    return data
  }

  const formatNumber = (value, original, decimals) => {
    const hasComma = original.includes(",")
    const hasDot = original.includes(".")
    const hasSpace = original.includes(" ")

    let formatted =
      decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toString()

    if (hasSpace || (hasComma && !hasDot) || (hasDot && !hasComma)) {
      const parts = formatted.split(".")
      const separator = hasSpace ? " " : hasComma ? "," : "."
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)
      formatted = parts.join(decimals > 0 ? (hasComma ? "," : ".") : "")
    }

    return formatted
  }

  const animate = (data, instance) => {
    if (data.animated && data.config.once) return
    if (instance.animating.has(data.element)) return
    if (instance.animating.size >= instance.config.maxConcurrent) return

    instance.animating.add(data.element)

    const { config, element, targets, countSpan, countData } = data
    const start = performance.now() + config.delay
    const easing = easings[config.easing]

    let splitAnim = config
    if (targets && config.splitAnimation) {
      splitAnim = parseClasses(config.splitAnimation, instance)
    }

    if (config.text) {
      const textTargets = targets || [element]
      const startTime = performance.now()

      const tick = () => {
        const elapsed = performance.now() - startTime
        const cycleProgress = (elapsed % config.duration) / config.duration

        textTargets.forEach((target, i) => {
          if (config.text === "shimmer") {
            const phase = cycleProgress * Math.PI * 2 + i * 0.5
            const intensity = Math.sin(phase) * 0.5 + 0.5
            applyStyles(target, {
              opacity: 0.5 + intensity * 0.5,
              filter: `brightness(${1 + intensity * 0.3})`,
            })
          } else {
            const wavePosition = cycleProgress * 1.6 - 0.3

            const letterPosition = i / textTargets.length
            const distance = Math.abs(wavePosition - letterPosition)

            let intensity = distance < 0.3 ? 1 - distance / 0.3 : 0

            const weight = Math.round(100 + intensity * 800)
            applyStyles(target, {
              fontWeight: weight.toString(),
              opacity: "1",
            })
          }
        })
        data.rafId = requestAnimationFrame(tick)
      }

      tick()
      data.animated = true
      return
    }

    const tick = () => {
      const now = performance.now()
      const elapsed = Math.max(0, now - start)
      const progress = Math.min(elapsed / config.duration, 1)
      const easedProgress = easing(progress)

      if (countSpan && countData) {
        const value = countData.value * easedProgress
        countSpan.textContent =
          progress >= 1
            ? countData.original
            : formatNumber(value, countData.original, countData.decimals)
      }

      if (targets) {
        let allComplete = true

        targets.forEach((target, index) => {
          const targetDelay = index * config.splitDelay
          const targetElapsed = elapsed - targetDelay

          if (targetElapsed < 0) {
            allComplete = false
            return
          }

          const targetProgress = Math.min(targetElapsed / config.duration, 1)
          const targetEased = easing(targetProgress)

          const [opacity, transform] = getTransform(
            splitAnim.animation || config.animation,
            splitAnim.direction || config.direction,
            targetEased,
          )

          applyStyles(target, {
            opacity,
            transform: transform !== "none" ? transform : "",
            filter:
              config.blur && targetEased < 1
                ? `blur(${(1 - targetEased) * 10}px)`
                : "",
          })

          if (targetProgress < 1) {
            allComplete = false
          }
        })

        if (!allComplete) {
          data.rafId = requestAnimationFrame(tick)
        } else {
          instance.animating.delete(element)
          data.animated = true
          element.setAttribute("data-usal-animated", "1")
        }
      } else {
        const [opacity, transform] = getTransform(
          config.animation,
          config.direction,
          easedProgress,
        )

        applyStyles(element, {
          opacity,
          transform: transform !== "none" ? transform : "",
          filter:
            config.blur && easedProgress < 1
              ? `blur(${(1 - easedProgress) * 10}px)`
              : "",
        })

        if (progress < 1) {
          data.rafId = requestAnimationFrame(tick)
        } else {
          instance.animating.delete(element)
          data.animated = true
          element.setAttribute("data-usal-animated", "1")
        }
      }
    }

    data.rafId = requestAnimationFrame(tick)
  }

  const reset = (data, instance) => {
    if (data.rafId) {
      cancelAnimationFrame(data.rafId)
      data.rafId = null
    }

    const { element, original, targets, config, countSpan } = data

    if (!config.text && !countSpan && !targets) {
      const [opacity, transform] = getTransform(
        config.animation,
        config.direction,
        0,
      )
      applyStyles(element, {
        opacity: "0",
        transform: transform !== "none" ? transform : "",
        filter: config.blur ? "blur(10px)" : "",
      })
    } else {
      applyStyles(element, original)
    }

    if (countSpan) countSpan.textContent = "0"

    if (targets) {
      const [, transform] = getTransform(config.animation, config.direction, 0)
      targets.forEach((target) =>
        applyStyles(target, {
          opacity: "0",
          transform: transform !== "none" ? transform : "",
          filter: config.blur ? "blur(10px)" : "",
        }),
      )
    }

    data.animated = false
    element.removeAttribute("data-usal-animated")
    instance.animating.delete(element)
  }

  const processDOMChanges = (instance) => {
    const current = new Set()

    document.querySelectorAll("[data-usal]").forEach((el) => {
      const id = el.getAttribute("data-usal-id")
      const newClasses = el.getAttribute("data-usal")

      if (id && instance.elements.has(id)) {
        current.add(id)
        const data = instance.elements.get(id)

        if (newClasses !== data.configString) {
          reset(data, instance)
          instance.elements.delete(id)
          const newData = processElement(el, instance)

          if (instance.observer) {
            instance.observer.observe(el)
          }
          if (isVisible(el)) animate(newData, instance)
        }
      } else {
        const data = processElement(el, instance)
        const newId = data.element.getAttribute("data-usal-id")
        current.add(newId)

        if (instance.observer) {
          instance.observer.observe(el)
        }

        if (isVisible(el)) animate(data, instance)
      }
    })

    instance.elements.forEach((data, id) => {
      if (!current.has(id)) {
        if (data.rafId) cancelAnimationFrame(data.rafId)

        if (instance.observer) {
          instance.observer.unobserve(data.element)
        }
        instance.elements.delete(id)
      }
    })
  }

  const setupObservers = (instance) => {
    if (instance.observer) instance.observer.disconnect()

    const thresholds = new Set([0])
    instance.elements.forEach((data) => {
      const threshold =
        (data.config.threshold || instance.config.defaultThreshold) / 100
      thresholds.add(threshold)
    })

    instance.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const data = instance.elements.get(
            entry.target.getAttribute("data-usal-id"),
          )
          if (!data) return

          const elementThreshold =
            (data.config.threshold || instance.config.defaultThreshold) / 100

          if (entry.intersectionRatio >= elementThreshold && !data.animated) {
            animate(data, instance)
          } else if (
            entry.intersectionRatio === 0 &&
            data.animated &&
            !data.config.once
          ) {
            reset(data, instance)
          }
        })
      },
      {
        threshold: Array.from(thresholds).sort((a, b) => a - b),
      },
    )

    instance.elements.forEach((data) => instance.observer.observe(data.element))

    if (instance.mutationObserver) instance.mutationObserver.disconnect()
    instance.mutationObserver = new MutationObserver(() =>
      requestAnimationFrame(() => processDOMChanges(instance)),
    )

    instance.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-usal"],
    })
  }

  const createInstance = (config = {}) => {
    const instance = {
      observer: null,
      mutationObserver: null,
      elements: new Map(),
      animating: new Set(),
      config: {
        maxConcurrent: 100,
        defaultDuration: 1000,
        defaultDelay: 0,
        defaultThreshold: 30,
        defaultSplitDelay: 30,
        ...config,
      },
    }

    return {
      init(newConfig = {}) {
        Object.assign(instance.config, newConfig)
        processDOMChanges(instance)
        setupObservers(instance)
      },

      destroy() {
        ;[instance.observer, instance.mutationObserver].forEach((o) =>
          o?.disconnect(),
        )
        instance.elements.forEach((data) => {
          if (data.rafId) cancelAnimationFrame(data.rafId)
          applyStyles(data.element, data.original)
        })
        instance.elements.clear()
        instance.animating.clear()
      },

      refresh() {
        processDOMChanges(instance)
      },

      createInstance: () => createInstance(config),
    }
  }

  const globalInstance = createInstance()

  return {
    ...globalInstance,
    createInstance,
  }
})()

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => USAL.init())
  } else {
    USAL.init()
  }
  window.USAL = USAL
}

export default USAL
