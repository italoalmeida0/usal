const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',

  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
};

const calculateBgColor = (colorCode) => {
  const match = colorCode.match(/(\d\d)m$/);
  const colorNum = parseInt(match[1]);
  if ((colorNum >= 30 && colorNum <= 37) || (colorNum >= 90 && colorNum <= 97))
    return `\x1b[${colorNum + 10}m`;
  return '\x1b[40m';
};

const colorMap = {
  header: colors.cyan,
  success: colors.green,
  warning: colors.yellow,
  error: colors.red,
  info: colors.blue,
  highlight: colors.magenta,
  tag: colors.blue,
  package: colors.brightMagenta,
  version: colors.brightCyan,
  file: colors.cyan,
  command: colors.yellow,
  dim: colors.dim,
  accent: colors.brightMagenta,
  divider: colors.dim,
  update: colors.yellow,

  red: colors.red,
  green: colors.green,
  yellow: colors.yellow,
  blue: colors.blue,
  magenta: colors.magenta,
  cyan: colors.cyan,
  white: colors.white,
  black: colors.black,
  brightRed: colors.brightRed,
  brightGreen: colors.brightGreen,
  brightYellow: colors.brightYellow,
  brightBlue: colors.brightBlue,
  brightMagenta: colors.brightMagenta,
  brightCyan: colors.brightCyan,
  brightWhite: colors.brightWhite,
  brightBlack: colors.brightBlack,
};

export const colorize = (text, parentColor = '') => {
  let result = '';
  let i = 0;

  while (i < text.length) {
    if (text.slice(i, i + 2) === '/#') {
      const isTag = text[i + 2] === '[';
      const colorStart = i + (isTag ? 3 : 2);
      const colorEnd = text.indexOf(' ', colorStart);

      if (colorEnd === -1) {
        result += text[i];
        i++;
        continue;
      }

      const colorName = text.slice(colorStart, colorEnd);
      const contentStart = colorEnd + 1;
      let depth = 1;
      let pos = contentStart;

      while (pos < text.length && depth > 0) {
        if (text.slice(pos, pos + 2) === '/#') {
          depth++;
          pos += 2;
        } else if (text.slice(pos, pos + 3) === ' #/') {
          depth--;
          if (depth === 0) break;
          pos += 3;
        } else {
          pos++;
        }
      }

      if (depth === 0) {
        const content = text.slice(contentStart, pos);

        const currentColor =
          isTag || parentColor.split('m').length === 3
            ? calculateBgColor(colorMap[colorName]) + colors.black
            : colorMap[colorName];
        const processedContent = colorize(content, currentColor);

        if (currentColor) {
          let resetCode = colors.reset;
          resetCode += parentColor;
          result += `${currentColor}${processedContent}${resetCode}`;
        } else {
          result += processedContent;
        }

        i = pos + 3;
      } else {
        result += text[i];
        i++;
      }
    } else {
      result += text[i];
      i++;
    }
  }

  return result;
};

export const colorLog = (text) => console.log(colorize(text));
export const hLog = (indentation, isTag, color, header = '', text = '', prefix = '') => {
  let logMethod;
  switch (color) {
    case 'error':
      logMethod = console.error;
      break;
    case 'warning':
      logMethod = console.warn;
      break;
    default:
      logMethod = console.log;
  }

  if (isTag) header = ' ' + header.toUpperCase() + ' ';

  logMethod(
    ' '.repeat(indentation) +
      colorize(`${prefix}/#${isTag ? '[' : ''}${color} ${header} #/ ${text}`)
  );
};
