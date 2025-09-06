<div align="center">

![Logo USAL.js](https://github.com/italoalmeida0/usal/raw/main/assets/logo.png)

**Ultimate Scroll Animation Library - 9KB of pure JavaScript magic ✨**

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
- 📦 **Only 9KB minified** (5KB Gzipped)
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
import { usal, createUSAL } from '@usal/svelte';
const usalInstance = createUSAL();
```

### Vue (Nuxt)

```js
export default defineNuxtConfig({
modules: ['@usal/vue/nuxt']
```

### Lit

```js
import { usal, useUSAL } from '@usal/lit';
const usalInstance = useUSAL();
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

```html
<!-- Split text by words -->
<h1 data-usal="split-word fade-u">Hello World</h1>

<!-- Split text by letters -->
<h1 data-usal="split-letter zoomin">USAL.js</h1>

<!-- Split with custom delay -->
<p data-usal="split-word fade-r split-delay-100">Animated paragraph</p>

<!-- Split child items -->
<ul data-usal="split-item flip-l">
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
```

### 🔢 Count Animation

![Count Animations](https://github.com/italoalmeida0/usal/raw/main/assets/count.gif)

```html
<!-- Count to integer -->
<span data-usal="count-1000">0</span>

<!-- Count to decimal -->
<span data-usal="count-98.5">0</span>

<!-- Count to formatted number -->
<span data-usal="count-42,350">0</span>
```

### ✨ Text Effects

![Text Effects](https://github.com/italoalmeida0/usal/raw/main/assets/text.gif)

```html
<!-- Shimmer effect (use with split-letter) -->
<h1 data-usal="split-letter text-shimmer">Shimmer Text</h1>

<!-- Fluid weight animation -->
<h1 data-usal="split-letter text-fluid">Fluid Text</h1>
```

### ⚙️ Modifiers

#### Duration

```
duration-300    duration-500    duration-800
duration-1000   duration-1500   duration-2000
```

#### Delay

```
delay-100       delay-200       delay-300
delay-500       delay-800       delay-1000
```

#### Easing

```
linear          ease            ease-in
ease-out        ease-in-out
```

#### Other Modifiers

```
blur            once            threshold-10
threshold-30    threshold-50    threshold-70
```

### 🔧 JavaScript API

#### Configuration

```javascript
// Initialize with custom settings
window.USAL.config({
  maxConcurrent: 100, // Maximum concurrent animations
  duration: 1000, // Default animation duration (ms)
  delay: 0, // Default animation delay (ms)
  threshold: 30, // Viewport threshold for trigger (%)
  splitDelay: 30, // Delay between split items (ms)
  once: false, // Run animation only once
});

// Reconfigure at any time
window.USAL.config({
  duration: 2000,
  once: true,
});
```

#### Cleanup

```javascript
// Remove all animations and observers
window.USAL.destroy();
```

### 🎯 Custom IDs

```html
<!-- Auto-generated ID (re-animates on re-render) -->
<div data-usal="fade-u">Auto ID</div>

<!-- Fixed ID (prevents re-animation) -->
<div data-usal="fade-u" data-usal-id="hero-section">Fixed ID</div>
```

> **💡 Tip:** For large elements (height > 100vh), use lower thresholds like `threshold-5` or `threshold-10` to ensure animations trigger properly.

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
| **🚀 USAL.js** | **~9KB / ~5KB**        | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅      |
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
