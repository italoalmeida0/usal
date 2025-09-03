// ANSI color codes
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',

  // Regular colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Bright colors
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',

  // Bright background colors
  bgBrightBlack: '\x1b[100m',
  bgBrightRed: '\x1b[101m',
  bgBrightGreen: '\x1b[102m',
  bgBrightYellow: '\x1b[103m',
  bgBrightBlue: '\x1b[104m',
  bgBrightMagenta: '\x1b[105m',
  bgBrightCyan: '\x1b[106m',
  bgBrightWhite: '\x1b[107m',
};

// Color helper functions
export const colorize = (() => {
  // Helper function for simple colored text
  const makeSimple = (color) => {
    return (text) => `${color}${text}${colors.reset}`;
  };

  // Helper function for tags with colored background
  const makeTag = (bgColor, normalColor) => {
    return (text) => {
      // If starts with [ and ends with ], remove and add background
      if (text.startsWith('[') && text.endsWith(']')) {
        const cleanText = text.slice(1, -1);
        return `${bgColor}${colors.brightWhite} ${cleanText} ${colors.reset}`;
      }
      // Otherwise, return with normal color only
      return `${normalColor}${text}${colors.reset}`;
    };
  };

  return {
    // Colors with automatic tag detection for []
    header: makeTag(colors.bgCyan, colors.bright + colors.brightCyan),
    success: makeTag(colors.bgGreen, colors.brightGreen),
    warning: makeTag(colors.bgYellow, colors.brightYellow),
    error: makeTag(colors.bgRed, colors.brightRed),
    info: makeTag(colors.bgBlue, colors.brightBlue),
    highlight: makeTag(colors.bgMagenta, colors.bright + colors.white),
    tag: makeTag(colors.bgBlue, colors.brightWhite),

    // Simple text without background
    package: makeSimple(colors.bright + colors.magenta),
    version: makeSimple(colors.brightCyan),
    file: makeSimple(colors.cyan),
    command: makeSimple(colors.yellow),
    dim: makeSimple(colors.dim),
    accent: makeSimple(colors.brightMagenta),
    brightGreen: makeSimple(colors.brightGreen),
    divider: makeSimple(colors.dim),
    update: makeSimple(colors.yellow),

    // Special symbols
    updateArrow: () => `${colors.brightCyan}→${colors.reset}`,
    bullet: () => `${colors.brightBlue}•${colors.reset}`,

    // Box always with background
    box: (text) => {
      const cleanText = text.startsWith('[') && text.endsWith(']') ? text.slice(1, -1) : text;
      return `${colors.bgBlue}${colors.brightWhite} ${cleanText} ${colors.reset}`;
    },
  };
})();
