<div align="center">

![Logo USAL.js](https://github.com/italoalmeida0/usal/raw/main/assets/logo.png)

**Ultimate Scroll Animation Library - 9KB of pure JavaScript magic ✨**

**Works with React, Solid, Svelte, Vue, Lit, Angular, Vanilla JS and more**

</div>

## Features

- 🎯 40+ animations (fade, zoom, flip with all directions)
- 📝 Text animations (split by word/letter)
- 🔢 Number counters
- 🎨 Text effects (shimmer, fluid)
- 📦 Only 9KB minified
- 🚀 Zero dependencies
- ⚡ 60fps performance
- 🪤 Web Components Supported
- 🔧 Framework agnostic

## Packages

| Package         | Description               | Version                                            |
| --------------- | ------------------------- | -------------------------------------------------- |
| `usal`          | Core library (Vanilla JS) | ![npm](https://img.shields.io/npm/v/usal)          |
| `@usal/react`   | React integration         | ![npm](https://img.shields.io/npm/v/@usal/react)   |
| `@usal/solid`   | Solid integration         | ![npm](https://img.shields.io/npm/v/@usal/solid)   |
| `@usal/svelte`  | Svelte integration        | ![npm](https://img.shields.io/npm/v/@usal/svelte)  |
| `@usal/vue`     | Vue integration           | ![npm](https://img.shields.io/npm/v/@usal/vue)     |
| `@usal/lit`     | Lit integration           | ![npm](https://img.shields.io/npm/v/@usal/lit)     |
| `@usal/angular` | Angular integration       | ![npm](https://img.shields.io/npm/v/@usal/angular) |

## Installation

CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/usal@latest/usal.min.js"></script>
```

NPM:

```bash
npm install usal

# Framework-specific packages:
npm install @usal/react
npm install @usal/solid
npm install @usal/svelte
npm install @usal/vue
npm install @usal/lit
npm install @usal/angular
```

[Full documentation and examples](https://italoalmeida0.github.io/usal)

# API Documentation

## Property Names

### data-usal

> Main animation attribute

```html
<div data-usal="fade-u">Content</div>
<div data-usal="zoomin duration-800">With duration</div>
<div data-usal="flip-r delay-500 blur">Complex</div>

<!-- Framework-specific usage -->
<!-- Svelte -->
<div use:usal={'fade duration-500'}>Content</div>
<!-- Vue -->
<div v-usal="'fade duration-500'">Content</div>
<!-- Angular -->
<div [usal]="'fade duration-500'">Content</div>
```

### data-usal-id

> Unique identifiers control animation reactivity

```html
<!-- Automatic ID (re-animates when element is recreated) -->
<div data-usal="fade-u">Auto ID</div>
<!-- Custom ID (prevents re-animation) -->
<div data-usal="fade-u" data-usal-id="unique-element">Fixed ID</div>
```

**Tip: For large elements (>100vh), use lower thresholds like threshold-5 or threshold-10 to ensure animations trigger properly.**

## Property Values

### Available Animations

> Core animation types

![Animations](https://github.com/italoalmeida0/usal/raw/main/assets/all.gif)

```javascript
// Basic animations
(fade, fade - u, fade - d, fade - l, fade - r);
(fade - ul, fade - ur, fade - dl, fade - dr);
// Zoom in animations
(zoomin, zoomin - u, zoomin - d, zoomin - l, zoomin - r);
(zoomin - ul, zoomin - ur, zoomin - dl, zoomin - dr);
// Zoom out animations
(zoomout, zoomout - u, zoomout - d, zoomout - l, zoomout - r);
(zoomout - ul, zoomout - ur, zoomout - dl, zoomout - dr);
// Flip animations
(flip, flip - u, flip - d, flip - l, flip - r);
(flip - ul, flip - ur, flip - dl, flip - dr);
```

### Split Animations

> Animate text parts individually

![Split Animations](https://github.com/italoalmeida0/usal/raw/main/assets/split.gif)

```javascript
// Split by words
split - word;
// Split by letters
split - letter;
// Split by child items
split - item;
// Split with custom animation
(split - fade - r, split - fade - u, split - zoomin);
// Split delay in milliseconds
(split - delay - 50, split - delay - 100);
```

### Modifiers

> Animation behavior modifiers

```javascript
// Duration in milliseconds
duration-500, duration-1000, duration-2000
// Delay in milliseconds
delay-200, delay-500, delay-1000
// Easing functions
linear, ease, ease-in, ease-out
// Other modifiers
blur, once, threshold-50
```

### Count Animation

> Animate numbers from 0 to target

![Count Animations](https://github.com/italoalmeida0/usal/raw/main/assets/count.gif)

```javascript
// count-[1234], count-[98.5], count-[42,350]
count - [number];
```

### Text Effects

> Special text animations (for letters, use with split-letter)

![Text Effects](https://github.com/italoalmeida0/usal/raw/main/assets/text.gif)

```javascript
// Shimmer effect
text - shimmer;
// Fluid weight animation
text - fluid;
```

## JavaScript API

### USAL.init(options)

> Initialize with configuration

```javascript
USAL.init({
  maxConcurrent: 100, // Max concurrent animations
  defaultDuration: 1000, // Default duration (ms)
  defaultDelay: 0, // Default delay (ms)
  defaultThreshold: 30, // Default threshold (%)
  defaultSplitDelay: 30, // Default split delay (ms)
});
```

### USAL.refresh()

> Refresh DOM and detect new elements

```javascript
// Refresh after dynamic content changes
USAL.refresh();
```

### USAL.destroy()

> Clean up and remove all animations

```javascript
// Clean up when done
USAL.destroy();
```

## Inspirations & Acknowledgments

USAL.js was inspired by and builds upon the excellent work of several projects:

- **[AOS.js](https://github.com/michalsnik/aos)** by Michał Sajnóg - The pioneering scroll animation library that established the foundation for attribute-based animations
- **[SAL.js](https://github.com/mciastek/sal)** by Mirek Ciastek - A lightweight and performant alternative that influenced our optimization approach
- **[Tailwind CSS](https://github.com/tailwindlabs/tailwindcss)** - The utility-first CSS framework that inspired our modifier syntax and naming conventions

While USAL.js is a complete rewrite with unique features like text effects, number counters, and split animations, we acknowledge the foundational concepts and approaches established by these projects.

---

> MIT License  
> Copyright (c) 2025 Italo Almeida  
> [@italoalmeida0](https://github.com/italoalmeida0)
