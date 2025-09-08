# Changelog

All notable changes to USAL.js will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## [1.1.0] - 2025-09-01

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

[1.1.1]: https://github.com/italoalmeida0/usal/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/italoalmeida0/usal/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/italoalmeida0/usal/releases/tag/v1.0.0
