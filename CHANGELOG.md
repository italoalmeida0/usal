# Changelog

All notable changes to USAL.js will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Analisando a diff da versão 1.2.2, aqui está o changelog:

## [1.2.2] - 2025-09-10

### Added

- **Advanced loop types**: New `loop-mirror` and `loop-jump` modifiers for different loop behaviors
  - `loop-mirror`: Back and forth animation (default behavior)
  - `loop-jump`: Restart animation from beginning
- **Enhanced split delay stagger patterns**: New stagger types for split animations
  - `split-delay-{value}-linear`: Linear distance-based stagger
  - `split-delay-{value}-center`: Center-outward stagger on X/Y axes
  - `split-delay-{value}-edges`: Edges-inward stagger on X/Y axes
  - `split-delay-{value}-random`: Random stagger pattern
- **Improved blur precision**: Support for decimal blur values (e.g., `blur-0.5`, `blur-1.5`)
- **Enhanced easing options**: Added `ease-in-out`, `step-start`, and `step-end` easing functions

### Changed

- **Loop configuration**: Default loop type can now be configured via `config.defaults.loop` (default: 'mirror')
- **Playground improvements**: Enhanced controls and preset examples including new stagger effects
- **Animation engine**: Refactored animation controller with better state management and performance
- **Split animation syntax**: Improved parsing for split animations with tuning parameters

## [1.2.1] - 2025-09-09

### Fixed

- **Animation tuning**: Fixed parsing of tuning values when no direction is specified (e.g., `fade-50`, `flip-90` now work correctly)

## [1.2.0] - 2025-09-09

### Added

- **Loop animations**: New `loop` modifier for continuous animation cycles
- **Custom timeline animations**: Advanced `line-[{timeline}]` syntax for precise keyframe control
  - Support for opacity, scale, translate, rotate, blur, and perspective properties
  - Multi-keyframe animations with percentage-based timing
  - 3D transformations with proper transform order handling
- **Animation tuning**: Numeric parameters for fine-tuning standard animations
  - Fade movement distance control (e.g., `fade-40` for 40% movement)
  - Zoom intensity and movement customization (e.g., `zoomin-40-60`)
  - Flip angle and perspective adjustment (e.g., `flip-120-50`)
- **Enhanced blur effects**: Custom blur intensity with `blur-{value}` syntax
- **Forwards modifier**: `forwards` option to maintain final animation state
- **Comprehensive debug panel**: Extended testing suite for new features

### Changed

- **Bundle size**: Updated from ~5KB to ~8KB gzipped due to new advanced features
- **API documentation**: Moved detailed API docs to separate file and wiki
- **Framework icons**: Added emoji icons to framework setup sections
- **Performance comparison**: Updated competitor bundle sizes and feature matrix

### Enhanced

- **Configuration system**: Extended config array to support new animation types
- **Split animations**: Improved handling with new animation tuning system
- **Transform composition**: Better transform order handling for complex animations
- **Style management**: Enhanced keyframe generation for custom timelines

### Fixed

- **Element cleanup**: Improved cleanup process for disconnected elements
- **Animation state**: Better handling of loop and forwards states
- **Split text**: Enhanced inline-block display for split animations

## [1.1.1] - 2025-09-08

### Changed

- Complete API overhaul with promise-based chain system using Rust-like enum states
- Significantly improved edge case handling for extreme usage scenarios
- Better orchestrated state machine for animation lifecycle
- Enhanced public API usability and consistency
- Improved error handling and recovery mechanisms

### Added

- Comprehensive debug panel in source code for development testing (debug.html, debug.css, debug.js)

### Fixed

- Text animations losing characteristics in flex containers without wrapper
- Smooth scroll issue on mobile when switching tabs

## [1.1.0] - 2025-09-07

### Changed

- **BREAKING**: Complete migration to Web Animations API (WAAPI) for all animations
- Only count animations remain using RAF for precise number formatting
- Zero direct DOM manipulation - no inline styles or attributes
- Eliminated SSR hydration mismatches
- No longer manipulates HTML node attributes directly

### Added

- Perfect compatibility with React, Vue, Svelte, Solid, and other SSR frameworks
- Better browser optimization and hardware acceleration

### Performance

- Significantly improved performance through WAAPI
- Reduced JavaScript overhead
- Better memory management

## [1.0.0] - 2025-09-03

### Added

- Initial release with 40+ scroll-triggered animations
- Intersection Observer based triggers
- Zero dependencies, ~5KB gzipped
- Full Shadow DOM support
- Framework packages for React, Vue, Svelte, Solid, Lit, Angular
- Automatic initialization
- Split text animations (word/letter)
- Count animations with smart number formatting
- Custom easing support
- Blur effects
- Threshold controls
- Duration and delay modifiers

[1.2.1]: https://github.com/italoalmeida0/usal/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/italoalmeida0/usal/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/italoalmeida0/usal/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/italoalmeida0/usal/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/italoalmeida0/usal/releases/tag/v1.0.0
