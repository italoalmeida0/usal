<div align="center">

  <picture>
    <source media="(prefers-color-scheme: dark)" 
            srcset="https://raw.githubusercontent.com/italoalmeida0/usal/refs/heads/main/assets/brand/usal_logo_dark.svg">
    <img src="https://raw.githubusercontent.com/italoalmeida0/usal/refs/heads/main/assets/brand/usal_logo.svg" alt="USAL.js">
  </picture>
  <picture>
    <img style="max-width: 144px" src="https://raw.githubusercontent.com/italoalmeida0/usal/refs/heads/main/assets/brand/usal_icon_512.webp" alt="⚡">
  </picture>

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
- 📦 **Only 8KB Gzipped**
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

### ⬛ React (Next.js)

```jsx
import { USALProvider } from '@usal/react';
<USALProvider>{children}</USALProvider>;
```

### 🟦 Solid (SolidStart)

```jsx
import { USALProvider } from '@usal/solid';
<USALProvider>{props.children}</USALProvider>;
```

### 🟧 Svelte (SvelteKit)

```js
import { usal } from '@usal/svelte';
// USAL auto-initializes globally
```

### 🟩 Vue (Nuxt)

```js
import { USALPlugin } from '@usal/vue';
createApp(App).use(USALPlugin).mount('#app');
//for Nuxt
export default defineNuxtConfig({
modules: ['@usal/vue/nuxt']
//...
```

### 🟪 Lit

```js
import { usal } from '@usal/lit';
// USAL auto-initializes globally
```

### 🟥 Angular

```js
import { USALModule } from '@usal/angular';
@Component({imports: [USALModule]})
export class AppComponent
```

## 📐 Basic Usage

```html
<!-- Simple animation -->
<div data-usal="fade-u">Fade from bottom</div>

<!-- With modifiers -->
<div data-usal="zoomin duration-800 delay-200">Zoom in</div>

<!-- Complex animation -->
<div data-usal="flip-r delay-500 blur once">Flip from right</div>
```

## [📖 Complete API Documentation](https://github.com/italoalmeida0/usal/wiki/API-Documentation) or https://usal.dev/#api

## 🎲 Demos

![Animations](https://github.com/italoalmeida0/usal/raw/main/assets/all.gif)

![Text Animations](https://github.com/italoalmeida0/usal/raw/main/assets/text.gif)

![Count Animations](https://github.com/italoalmeida0/usal/raw/main/assets/count.gif)

![Split Animations](https://github.com/italoalmeida0/usal/raw/main/assets/split.gif)

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

| Framework      | Bundle Size (gzip) | React     | Vue       | Angular   | Svelte    | Solid     | Lit       | Vanilla |
| -------------- | ------------------ | --------- | --------- | --------- | --------- | --------- | --------- | ------- |
| **🚀 USAL.js** | **~8KB**           | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅      |
| Motion One     | Variable (~small)  | ✅        | ✅        | ❌        | ❌        | ❌        | ❌        | ✅      |
| GSAP           | ~28KB              | ✅        | ✅        | ✅        | ✅        | ✅        | ✅        | ✅      |
| Anime.js v4    | ~27KB              | ✅        | ✅        | ✅        | ✅        | ✅        | ✅        | ✅      |
| Lottie         | ~60KB              | ⚠️        | ⚠️        | ⚠️        | ⚠️        | ⚠️        | ⚠️        | ✅      |
| AOS            | ~8KB               | ⚠️        | ⚠️        | ⚠️        | ❌        | ❌        | ❌        | ✅      |
| SAL.js         | ~2.7KB             | ❌        | ❌        | ❌        | ❌        | ❌        | ❌        | ✅      |

### Feature Comparison

| Framework   | Split (Letters/Words/Items) | Counters  | Scroll Trigger | Timeline    | SVG       | Learning      |
| ----------- | --------------------------- | --------- | -------------- | ----------- | --------- | ------------- |
| **USAL.js** | ✅ Core                     | ✅ Core   | ✅ Core        | ✅ Core     | ❌        | **Very Easy** |
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
