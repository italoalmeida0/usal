<div align="center">

![Logo USAL.js](https://github.com/italoalmeida0/usal/raw/main/assets/logo.png)

**Ultimate Scroll Animation Library - Lightweight, powerful, wonderfully simple ✨**

**Works with React, Solid, Svelte, Vue, Lit, Angular, Vanilla JS and more**

**[> usal.dev/](https://usal.dev/)**

[![Powered by Cloudflare](https://img.shields.io/badge/Powered%20by-Cloudflare-orange)](https://cloudflare.com)
[![Delivered by jsDelivr](https://img.shields.io/badge/Delivered%20by-jsDelivr-blue)](https://jsdelivr.com)
[![Available on npm](https://img.shields.io/badge/Available%20on-npm-red)](https://npmjs.com/package/usal)

</div>

## ✨ Features

- 🎯 **40+ animations** (fade, zoom, flip with all directions)
- 📝 **Text animations** (split by word/letter)
- 🔢 **Number counters**
- 🎨 **Text effects** (shimmer, fluid)
- 📦 **Only 5KB Gzipped**
- 🚀 **Zero dependencies**
- ♾ **60fps performance**
- 🪤 **Web components supported**
- 🔧 **Framework agnostic**
- ⚡ **CDN powered** by jsDelivr & Cloudflare

## 📦 Installation

### CDN (Quickstart)

```html
<script src="https://cdn.usal.dev/latest"></script>
```

### NPM

```bash
npm install usal

# Framework-specific packages
npm install @usal/react   # For React/Next.js
npm install @usal/solid   # For Solid/SolidStart
npm install @usal/svelte   # For Svelte/SvelteKit
npm install @usal/vue   # For Vue/Nuxt
npm install @usal/lit   # For Lit
npm install @usal/angular   # For Angular
```

## 🚀 Framework Setup

### React (Next.js)

```jsx
import { USALProvider } from '@usal/react';
<USALProvider>{children}</USALProvider>;
```

### Solid (SolidStart)

```jsx
import { USALProvider } from '@usal/solid';
<USALProvider>{props.children}</USALProvider>;
```

### Svelte (SvelteKit)

```js
import { usal } from '@usal/svelte';
// USAL auto-initializes globally
```

### Vue (Nuxt)

```js
export default defineNuxtConfig({
modules: ['@usal/vue/nuxt']
```

### Lit

```js
import { usal } from '@usal/lit';
// USAL auto-initializes globally
```

### Angular

```js
import { USALModule } from '@usal/angular';
@Component({imports: [USALModule]})
export class AppComponent
```

## 📖 API Documentation

### Basic Usage

```html
<!-- Simple animation -->
<div data-usal="fade-u">Fade from bottom</div>

<!-- With modifiers -->
<div data-usal="zoomin duration-800 delay-200">Zoom in</div>

<!-- Complex animation -->
<div data-usal="flip-r delay-500 blur once">Flip from right</div>
```

### Framework Usage

```html
<!-- Vanilla JS -->
<div data-usal="fade duration-500">Content</div>

<!-- React/Next.js -->
<div data-usal="fade duration-500">Content</div>

<!-- Solid/SolidStart -->
<div data-usal="fade duration-500">Content</div>

<!-- Svelte/SvelteKit -->
<div use:usal={'fade duration-500'}>Content</div>

<!-- Vue/Nuxt -->
<div v-usal="'fade duration-500'">Content</div>

<!-- Lit -->
<div ${usal('fade duration-500')}>Content</div>

<!-- Angular -->
<div [usal]="'fade duration-500'">Content</div>
```

### 🎨 Available Animations

![Animations](https://github.com/italoalmeida0/usal/raw/main/assets/all.gif)

#### Fade Animations

```
fade        fade-u      fade-d      fade-l      fade-r
fade-ul     fade-ur     fade-dl     fade-dr
```

#### Zoom In Animations

```
zoomin      zoomin-u    zoomin-d    zoomin-l    zoomin-r
zoomin-ul   zoomin-ur   zoomin-dl   zoomin-dr
```

#### Zoom Out Animations

```
zoomout     zoomout-u   zoomout-d   zoomout-l   zoomout-r
zoomout-ul  zoomout-ur  zoomout-dl  zoomout-dr
```

#### Flip Animations

```
flip        flip-u      flip-d      flip-l      flip-r
flip-ul     flip-ur     flip-dl     flip-dr
```

### 📝 Split Animations

![Split Animations](https://github.com/italoalmeida0/usal/raw/main/assets/split.gif)

#### Split Types

Split content into animated parts

```
split-word      // Split text by words
split-letter    // Split text by letters
split-item      // Split child elements
```

#### Split with Animation

Combine split with any animation type

```
split-fade-[direction]    // split-fade-u, split-fade-r
split-zoomin-[direction]  // split-zoomin, split-zoomin-l
split-flip-[direction]    // split-flip-d, split-flip-r
```

#### Split Delay

Control delay between split parts (milliseconds)

```
split-delay-[value]
// Examples: split-delay-30, split-delay-50, split-delay-100
```

```html
<h1 data-usal="split-word fade-u">Hello World</h1>

<h1 data-usal="split-letter zoomin">USAL.js</h1>

<p data-usal="split-word fade-r split-delay-100">Animated paragraph</p>

<ul data-usal="split-item flip-l">
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
```

### 🔢 Count Animation

Animate numbers from 0 to target value (preserves formatting)

![Count Animations](https://github.com/italoalmeida0/usal/raw/main/assets/count.gif)

```
count-[number]
// Examples:
count-[100]       // Count to 100
count-[98.5]     // Count to 98.5
count-[1,000]     // Count to 1,000
count-[42,350]    // Count to 42,350
count-[1 000 000]  // Count to 1 000 000
```

```html
<!-- Count isolated -->
<span data-usal="count-[1000]">1000</span>

<!-- Count in context -->
<span data-usal="count-[4.9]">Stars: 4.9/5</span>

<!-- Counting in a complex context -->
<span data-usal="count-[21 000 000.00]">
  In 2025, we will earn US$21 000 000.00 in the first quarter alone.
</span>
```

### ✨ Text Effects

Special effects for individual characters

![Text Effects](https://github.com/italoalmeida0/usal/raw/main/assets/text.gif)

```
text-shimmer    // Shimmering light sweep effect
text-fluid      // Morphing font weight animation
```

> **💡 Tip:** Must be combined with `split-letter`. For best results, use longer durations (1000-3000ms) and split delays between 50-100ms to create smooth, captivating animations.

```html
<!-- Shimmer effect -->
<h1 data-usal="text-shimmer split-letter duration-2000 split-delay-100">Shimmer Text</h1>

<!-- Fluid weight animation -->
<h1 data-usal="text-fluid split-letter duration-2000 split-delay-50">Fluid Text</h1>
```

### ⚙️ Modifiers

#### Duration

Control animation duration in milliseconds

```
duration-value
// Examples: duration-500, duration-1000, duration-2000
```

#### Delay

Add delay before animation starts (milliseconds)

```
delay-value
// Examples: delay-200, delay-500, delay-1000
```

#### Easing

```
linear          ease            ease-in         ease-out
easing-[value]  // Custom easing: easing-[cubic-bezier(0.4,0,0.2,1)]
```

#### Threshold

Control when animation triggers (percentage of element visible)

```
threshold-value
// Examples: threshold-10, threshold-30, threshold-50
```

> **💡 Tip:** For large elements (height > 100vh), use lower thresholds like `threshold-5` or `threshold-10` to ensure animations trigger properly.

#### Other Modifiers

```
blur            // Add blur effect during animation
once            // Run animation only once
```

### 🔧 JavaScript API

#### Configuration

```javascript
// Initialize with custom settings
window.USAL.config({
  defaults: {
    animation: 'fade', // Default animation type
    direction: 'u', // Default direction (u, d, l, r, ul, ur, dl, dr)
    duration: 1000, // Animation duration (ms)
    delay: 0, // Animation delay (ms)
    threshold: 10, // Viewport threshold for trigger (%)
    splitDelay: 30, // Delay between split items (ms)
    easing: 'ease-out', // CSS easing function
    blur: false, // Enable/disable blur effect
  },
  observersDelay: 50, // Delay for observers (ms)
  once: false, // Run animation only once
});

// Get current configuration
const currentConfig = window.USAL.config();

// Reconfigure at any time
window.USAL.config({
  defaults: {
    duration: 2000,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  once: true,
});

// Partial updates work too
window.USAL.config({
  defaults: {
    animation: 'zoomin',
    direction: 'l',
  },
});
```

#### Control Methods

```javascript
// Check if initialized
if (window.USAL.initialized()) {
  console.log('USAL is running');
}

// Restart USAL (destroy + reinitialize)
window.USAL.restart();

// Completely shut down USAL
window.USAL.destroy();

// Get version
console.log(window.USAL.version);
```

#### Easing Functions

```javascript
// Any valid CSS easing function
window.USAL.config({
  defaults: {
    easing: 'ease-in-out',
    // or
    easing: 'linear',
    // or custom cubic-bezier
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
});
```

#### Chaining

```javascript
// Methods return the instance for chaining
window.USAL.config({ defaults: { duration: 500 } })
  .restart()
  .config({ once: true });
```

### 🎯 Custom IDs

```html
<!-- Auto-generated ID (re-animates on re-render) -->
<div data-usal="fade-u">Auto ID</div>

<!-- Fixed ID (prevents re-animation) -->
<div data-usal="fade-u" data-usal-id="hero-section">Fixed ID</div>
```

## 📊 Packages Overview

| Package         | Description               | Version                                                                                                                                        |
| --------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `usal`          | Core library (Vanilla JS) | ![npm](https://badge.usal.dev/?nn&ps=%40usal%2Freact%2C%40usal%2Fsolid%2C%40usal%2Fsvelte%2C%40usal%2Fvue%2C%40usal%2Flit%2C%40usal%2Fangular) |
| `@usal/react`   | React integration         | ![npm](https://badge.usal.dev/?nn&p=%40usal%2Freact&color=grey)                                                                                |
| `@usal/solid`   | Solid integration         | ![npm](https://badge.usal.dev/?nn&p=%40usal%2Fsolid&color=blue)                                                                                |
| `@usal/svelte`  | Svelte integration        | ![npm](https://badge.usal.dev/?nn&p=%40usal%2Fsvelte&color=orange)                                                                             |
| `@usal/vue`     | Vue integration           | ![npm](https://badge.usal.dev/?nn&p=%40usal%2Fvue&color=green)                                                                                 |
| `@usal/lit`     | Lit integration           | ![npm](https://badge.usal.dev/?nn&p=%40usal%2Flit&color=cyan)                                                                                  |
| `@usal/angular` | Angular integration       | ![npm](https://badge.usal.dev/?nn&p=%40usal%2Fangular&color=red)                                                                               |

## 📈 JavaScript Animation Frameworks Comparison (2025)

### Performance & Size Comparison

| Framework      | Bundle Size (min/gzip) | React     | Vue       | Angular   | Svelte    | Solid     | Lit       | Vanilla |
| -------------- | ---------------------- | --------- | --------- | --------- | --------- | --------- | --------- | ------- |
| **🚀 USAL.js** | **~10KB / ~5KB**       | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅      |
| Motion One     | Variable (~small)      | ✅        | ✅        | ❌        | ❌        | ❌        | ❌        | ✅      |
| GSAP           | ~60KB+                 | ✅        | ✅        | ✅        | ✅        | ✅        | ✅        | ✅      |
| Anime.js v4    | ~27KB / ~27KB          | ✅        | ✅        | ✅        | ✅        | ✅        | ✅        | ✅      |
| Lottie         | ~237KB / ~60KB         | ⚠️        | ⚠️        | ⚠️        | ⚠️        | ⚠️        | ⚠️        | ✅      |
| AOS            | ~75KB / ~18KB          | ⚠️        | ⚠️        | ⚠️        | ❌        | ❌        | ❌        | ✅      |
| SAL.js         | ~2.5KB / ~1.2KB        | ❌        | ❌        | ❌        | ❌        | ❌        | ❌        | ✅      |

### Feature Comparison

| Framework   | Split (Letters/Words/Items) | Counters  | Scroll Trigger | Timeline    | SVG       | Learning      |
| ----------- | --------------------------- | --------- | -------------- | ----------- | --------- | ------------- |
| **USAL.js** | ✅ Core                     | ✅ Core   | ✅ Core        | ❌          | ❌        | **Very Easy** |
| Motion      | ❌                          | ❌        | ✅ Core        | ⚠️ Variants | ✅ Core   | Medium        |
| GSAP        | ⚠️ Plugin                   | ⚠️ Plugin | ✅ Plugin      | ✅ Advanced | ⚠️ Plugin | Complex       |
| Anime.js v4 | ✅ Core                     | ✅ Core   | ✅ Core        | ✅ Core     | ✅ Core   | Medium        |
| Lottie      | ⚠️ via AE                   | ⚠️ via AE | ❌             | ✅ Core     | ✅ Core   | Complex       |
| AOS         | ❌                          | ❌        | ✅ Core        | ❌          | ❌        | Very Easy     |
| SAL.js      | ❌                          | ❌        | ✅ Core        | ❌          | ❌        | Very Easy     |

**Legend:**

- ✅ Native/Core support
- ⚠️ Plugin/Wrapper required
- ❌ Not supported

## 🙏 Acknowledgments

USAL.js was inspired by:

- **[AOS.js](https://github.com/michalsnik/aos)** - Pioneering attribute-based animations
- **[SAL.js](https://github.com/mciastek/sal)** - Lightweight performance optimization
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first naming conventions

---

## 📄 License

MIT License © 2025 Italo Almeida ([@italoalmeida0](https://github.com/italoalmeida0))
