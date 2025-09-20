# Changelog

All notable changes to USAL.js will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-09-20

### Added

- **Brand identity refresh**: New logos and icon set with dark mode support
  - SVG logos with automatic dark/light theme switching
  - Complete icon set in multiple sizes (16px to 512px) and formats (PNG, WebP, GIF)
  - Updated favicon and social media assets

- **Text animation effects via timeline**: Shimmer and fluid effects now use timeline syntax
  - `text-shimmer`: Converted to `line-[o+50g+100|50o+100g+130|o+50g+100]`
  - `text-fluid`: Converted to `line-[w+100|50w+900|w+100]`
  - Effects can now be customized and combined with other timeline properties

- **Timeline property extensions**: New animation properties for advanced effects
  - `g±value`: Glow/brightness control (0-100+)
  - `w±value`: Font weight morphing (100-900)

- **Comprehensive test suites**: Added integration tests for all major frameworks
  - Angular, React/Next.js, Vue/Nuxt, Svelte/SvelteKit, Solid, Lit
  - Framework-specific examples and edge case testing

### Fixed

- **SSR compatibility**: Complete overhaul for server-side rendering safety
  - HTML structure preservation during split/count animations
  - No element cloning or reconstruction
  - Only text nodes modified for text/count animations
  - Eliminated hydration mismatches in SSR frameworks

- **Animation synchronization**: Fixed 5-95% progress bug causing visual artifacts
  - Animations now use full 0-100% range with proper edge handling
  - Eliminated "snap" effect at animation boundaries
  - Improved timing precision and synchronization

- **Angular integration**: Resolved directive compatibility issues
  - Migrated to standalone directive architecture
  - Fixed attribute binding with proper `usal="value"` syntax
  - Added platform browser checks for SSR safety

- **Default configuration**: Improved configuration inheritance system
  - `config.defaults` now properly cascades through all animation types
  - Consistent application of default values across split animations
  - Better respect for user-defined defaults

### Changed

- **Documentation improvements**: Reorganized for better discoverability
  - Framework usage examples moved directly below installation
  - Added Vue.js plugin setup alongside Nuxt configuration
  - Updated API documentation with new timeline properties

- **Animation engine robustness**: Enhanced safety and error handling
  - Added processing locks to prevent race conditions
  - Improved cleanup with proper promise chains
  - Better memory management with element state tracking
  - Enhanced edge case handling for complex DOM mutations

### Performance

- **DOM manipulation optimization**: Reduced layout thrashing
  - Text node replacement instead of innerHTML manipulation
  - RequestAnimationFrame batching for DOM updates
  - Eliminated unnecessary style recalculations

## [1.2.3] - 2025-09-16

### Added

- **Slide animation**: New `slide` animation type for pure movement without opacity changes
  - Supports all directional variants (slide-u, slide-d, slide-l, slide-r, etc.)
  - Maintains original element opacity throughout animation
  - Useful for elements that need to stay fully visible during entrance

### Fixed

- **Split text HTML preservation**: Split animations now correctly preserve HTML structure
  - Bold, italic, and other inline elements are maintained during split
  - Nested HTML elements remain properly formatted
  - Fixed issue where `textContent` was destroying HTML tags
- **Count animation HTML preservation**: Count animations now work with formatted text
  - Preserves surrounding HTML elements when replacing numbers
  - Works correctly with nested HTML structures

- **Animation type persistence**: Fixed parser bug that reset animation types
  - Animation configuration no longer lost when processing subsequent tokens
  - Fixed issue where all animations were defaulting to fade

- **Split animation tuning**: Fixed issue where split animations lost tuning values
  - Tuning parameters (e.g., fade-u-200) now correctly preserved with split text
  - Empty configuration arrays no longer override valid tuning values

- **Letter animation display**: Fixed inline-block application for split letter animations
  - Letters now animate correctly with proper display properties
  - Fixed "snap" effect when animations complete
  - Proper cleanup maintains inline-block for split elements

- **Build script compatibility**: Fixed Node.js version compatibility in build script
  - Added fallback for `file.path` in recursive directory reading
  - Works across Node.js versions 18-24

### Changed

- **Internal refactoring**: Improved code organization
  - Extracted `genEmptyConfig()` function for configuration generation
  - Renamed `splitByNotItem` to `isSplitText` for clarity
  - Better separation of concerns in split and count setup functions

### Performance

- **Animation cleanup**: Improved cleanup of cancelled animations
  - Better garbage collection hints with effect/timeline nullification
  - More efficient memory management for long-running applications

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

[1.3.0]: https://github.com/italoalmeida0/usal/compare/v1.2.3...v1.3.0
[1.2.3]: https://github.com/italoalmeida0/usal/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/italoalmeida0/usal/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/italoalmeida0/usal/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/italoalmeida0/usal/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/italoalmeida0/usal/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/italoalmeida0/usal/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/italoalmeida0/usal/releases/tag/v1.0.0
