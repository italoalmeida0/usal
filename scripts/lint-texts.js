import fs from 'fs';
import path from 'path';

import { detect } from 'langdetect';

import { colorize } from './colorize.js';

function findNonEnglishText(dir = '.') {
  const extensions = ['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.md', '.json'];
  const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'packages'];
  const skipFiles = ['.lock', 'package-lock.json', 'yarn.lock'];

  const nonEnglishTexts = [];

  const englishTechWords = [
    'build',
    'config',
    'package',
    'create',
    'update',
    'clean',
    'detect',
    'handle',
    'generate',
    'element',
    'animation',
    'script',
    'install',
    'framework',
    'vanilla',
    'typescript',
    'javascript',
    'loader',
    'support',
    'split',
    'counter',
    'pattern',
    'external',
    'dependencies',
    'special',
    'handling',
    'initial',
    'state',
    'main',
    'loop',
    'helper',
    'function',
    'output',
    'command',
    'version',
    'pattern',
    'match',
    'regex',
    'already',
    'built',
    'postbuild',
    'exists',
    'fail',
    'server',
    'side',
    'rendering',
    'return',
    'dummy',
    'methods',
    'window',
    'object',
    'array',
    'indices',
    'numbers',
    'instead',
    'keys',
    'performance',
    'bitwise',
    'flags',
    'directions',
    'allows',
    'combining',
    'multiple',
    'utility',
    'apply',
    'styles',
    'initialize',
    'default',
    'values',
    'parse',
    'direction',
    'chars',
    'combine',
    'using',
    'store',
    'extract',
    'easing',
    'functions',
    'mathematical',
    'curves',
    'smooth',
    'calculate',
    'rotation',
    'angle',
    'based',
    'diagonal',
    'single',
    'axis',
    'flip',
    'check',
    'vertical',
    'horizontal',
    'translation',
    'format',
    'decimals',
    'thousand',
    'separators',
    'add',
    'original',
    'had',
    'them',
    'unique',
    'tracking',
    'cancel',
    'existing',
    'targets',
    'null',
    'animations',
    'child',
    'elements',
    'text',
    'words',
    'letters',
    'preserve',
    'whitespace',
    'nodes',
    'limit',
    'concurrent',
    'set',
    'effects',
    'shimmer',
    'fluid',
    'wave',
    'like',
    'brightness',
    'effect',
    'weight',
    'animation',
    'changed',
    'reset',
    'reprocess',
    'intersection',
    'observer',
    'viewport',
    'visibility',
    'thresholds',
    'smooth',
    'detection',
    'mutation',
    'dom',
    'changes',
    'added',
    'removed',
    'attribute',
    'track',
    'animated',
    'currently',
    'animating',
    'cleanup',
    'observers',
    'auto',
    'initialize',
    'page',
    'load',
    'copy',
    'definitions',
    'readme',
    'license',
    'setup',
    'needed',
    'built',
    'packages',
    'run',
    'script',
    "don't",
    'fails',

    'error',
    'warning',
    'info',
    'debug',
    'console',
    'log',
    'true',
    'false',
    'undefined',
    'export',
    'import',
    'const',
    'let',
    'var',
    'class',
    'extends',
    'implements',
  ];

  function shouldSkipDir(dirName) {
    return skipDirs.some((skip) => dirName.includes(skip)) || dirName.startsWith('.');
  }

  function shouldSkipFile(fileName) {
    return skipFiles.some((skip) => fileName.includes(skip));
  }

  function extractStrings(line) {
    const strings = [];

    const stringPatterns = [/'([^'\\]|\\.)*'/g, /"([^"\\]|\\.)*"/g, /`([^`\\]|\\.)*`/g];

    stringPatterns.forEach((pattern) => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          const cleaned = match.slice(1, -1);

          if (
            cleaned.length > 3 &&
            !cleaned.startsWith('http') &&
            !cleaned.startsWith('./') &&
            !cleaned.startsWith('../') &&
            !cleaned.startsWith('/') &&
            !cleaned.match(/^[#.]\w+/) &&
            !cleaned.match(/^\w+:\w+/) &&
            !cleaned.match(/^[A-Z_]+$/) &&
            !cleaned.match(/^\d+(\.\d+)?$/)
          ) {
            strings.push({
              original: match,
              content: cleaned,
              type: 'string',
            });
          }
        });
      }
    });

    return strings;
  }

  function extractHtmlText(line) {
    const texts = [];

    const htmlTextPattern = />([^<>]+)</g;
    const matches = line.match(htmlTextPattern);

    if (matches) {
      matches.forEach((match) => {
        const text = match.slice(1, -1).trim();
        if (text.length > 3 && !text.match(/^[{}\[\]()]+$/)) {
          texts.push({
            original: match,
            content: text,
            type: 'html-text',
          });
        }
      });
    }

    return texts;
  }

  function extractComments(line, fileExt) {
    const comments = [];

    if (['.html', '.md'].includes(fileExt)) {
      const match = line.match(/<!--\s*(.*?)\s*-->/);
      if (match && match[1].length > 3) {
        comments.push({
          original: match[0],
          content: match[1],
          type: 'comment',
        });
      }
    } else {
      if (line.includes('//')) {
        const commentText = line.substring(line.indexOf('//') + 2).trim();
        if (commentText.length > 3) {
          comments.push({
            original: '//' + commentText,
            content: commentText,
            type: 'comment',
          });
        }
      } else if (line.includes('/*')) {
        const start = line.indexOf('/*') + 2;
        const end = line.includes('*/') ? line.indexOf('*/') : line.length;
        const commentText = line.substring(start, end).trim();
        if (commentText.length > 3) {
          comments.push({
            original: line.substring(line.indexOf('/*'), end + 2),
            content: commentText,
            type: 'comment',
          });
        }
      }
    }

    return comments;
  }
  function isLikelyEnglish(text) {
    const cleanText = text.toLowerCase().trim();

    if (cleanText.length < 3) return true;
    if (/^[a-z0-9\s\-_\.]+$/i.test(text) && cleanText.length < 10) return true;

    const codePatterns = [
      /^[a-z]+[-_][a-z]+/i,
      /^[a-z]+[A-Z]/,
      /\.(js|ts|css|html|json|md)$/i,
      /^https?:\/\//,
      /^@[a-z]/i,
      /^#[a-f0-9]{3,8}$/i,
      /^\d+(\.\d+)?(px|em|rem|%|vh|vw)$/i,
      /^[A-Z_]+$/,
      /^\$[a-z]/i,
    ];

    if (codePatterns.some((pattern) => pattern.test(cleanText))) {
      return true;
    }

    const words = cleanText.split(/\s+/).filter((word) => word.length > 0);
    if (words.length === 0) return true;

    const techWords = new Set([
      ...englishTechWords,

      'api',
      'css',
      'html',
      'js',
      'ts',
      'json',
      'xml',
      'sql',
      'http',
      'https',
      'dom',
      'url',
      'uri',
      'cdn',
      'npm',
      'git',
      'svg',
      'png',
      'jpg',
      'pdf',
      'async',
      'await',
      'const',
      'let',
      'var',
      'function',
      'class',
      'import',
      'export',
      'return',
      'true',
      'false',
      'null',
      'undefined',
      'new',
      'this',
      'config',
      'options',
      'params',
      'args',
      'props',
      'state',
      'ref',
      'key',
      'index',
      'length',
      'value',
      'name',
      'type',
      'id',
      'src',
      'href',
      'alt',
      'title',
      'style',
      'class',
      'div',
      'span',
      'button',
      'input',
      'form',
      'header',
      'footer',
      'main',
      'nav',
      'section',
      'article',
      'aside',
      'width',
      'height',
      'margin',
      'padding',
      'border',
      'color',
      'background',
      'font',
      'text',
      'display',
      'position',
      'top',
      'left',
      'right',
      'bottom',
      'flex',
      'grid',
      'block',
      'inline',
      'absolute',
      'relative',
      'fixed',
      'hover',
      'focus',
      'active',
      'disabled',
      'required',
      'optional',
      'mobile',
      'desktop',
      'tablet',
      'responsive',
      'breakpoint',
      'component',
      'module',
      'plugin',
      'library',
      'framework',
      'package',
      'version',
      'update',
      'install',
      'build',
      'deploy',
      'test',
      'debug',
      'error',
      'warning',
      'info',
      'success',
      'fail',
      'pass',
      'skip',
      'start',
      'stop',
      'restart',
      'pause',
      'resume',
      'toggle',
      'switch',
      'open',
      'close',
      'show',
      'hide',
      'visible',
      'hidden',
      'enabled',
      'get',
      'set',
      'add',
      'remove',
      'delete',
      'create',
      'update',
      'save',
      'load',
      'fetch',
      'post',
      'put',
      'patch',
      'head',
      'options',
      'user',
      'admin',
      'guest',
      'public',
      'private',
      'protected',
      'readonly',
      'data',
      'meta',
      'content',
      'body',
      'head',
      'script',
      'link',
      'media',
      'query',
      'filter',
      'sort',
      'search',
      'find',
      'match',
      'replace',
      'split',
      'join',
      'merge',
      'concat',
      'push',
      'pop',
      'shift',
      'slice',
      'map',
      'filter',
      'reduce',
      'foreach',
      'loop',
      'while',
      'for',
      'if',
      'else',
      'switch',
      'case',
      'default',
      'break',
      'continue',
      'try',
      'catch',
    ]);

    const commonEnglishWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'up',
      'about',
      'into',
      'through',
      'during',
      'before',
      'after',
      'above',
      'below',
      'between',
      'among',
      'under',
      'over',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'can',
      'must',
      'shall',
      'ought',
      'need',
      'dare',
      'used',
      'going',
      'this',
      'that',
      'these',
      'those',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
      'me',
      'him',
      'her',
      'us',
      'them',
      'my',
      'your',
      'his',
      'hers',
      'its',
      'our',
      'their',
      'mine',
      'yours',
      'ours',
      'theirs',
      'myself',
      'yourself',
      'himself',
      'herself',
      'itself',
      'ourselves',
      'themselves',
      'what',
      'which',
      'who',
      'whom',
      'whose',
      'where',
      'when',
      'why',
      'how',
      'all',
      'any',
      'both',
      'each',
      'few',
      'more',
      'most',
      'other',
      'some',
      'such',
      'no',
      'nor',
      'not',
      'only',
      'own',
      'same',
      'so',
      'than',
      'too',
      'very',
      'just',
      'now',
      'here',
      'there',
      'then',
      'once',
      'again',
      'also',
      'back',
      'still',
      'well',
      'away',
      'down',
      'even',
      'far',
      'how',
      'long',
      'many',
      'much',
      'often',
      'soon',
      'today',
      'tomorrow',
      'yesterday',
    ]);

    let techWordCount = 0;
    let englishWordCount = 0;
    let totalWords = 0;

    for (const word of words) {
      const cleanWord = word.replace(/[^a-z0-9]/g, '');
      if (cleanWord.length === 0) continue;

      totalWords++;

      if (techWords.has(cleanWord)) {
        techWordCount++;
        englishWordCount++;
      } else if (commonEnglishWords.has(cleanWord)) {
        englishWordCount++;
      }
    }

    if (totalWords === 0) return true;

    const techRatio = techWordCount / totalWords;
    const englishRatio = englishWordCount / totalWords;

    if (techRatio > 0.4) return true;
    if (englishRatio > 0.6) return true;
    if (techRatio > 0.2 && englishRatio > 0.4) return true;

    if (/^[a-z0-9\-_\.]+$/i.test(cleanText)) return true;

    if (words.length === 1 && /^[a-z][a-zA-Z0-9]*$/.test(cleanText)) return true;

    if (words.length <= 2 && englishRatio > 0) return true;

    if (/[^\x00-\x7F]/.test(text)) {
      return englishRatio > 0.7;
    }

    return false;
  }

  function detectLanguage(text) {
    if (isLikelyEnglish(text)) {
      return 'en';
    }

    const cleanText = text
      .replace(/[{}()\[\];,.\-_=+*/\\]/g, ' ')
      .replace(/\b[A-Z_]+\b/g, ' ')
      .replace(/\b\w+[A-Z]\w*\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanText.length < 8) return 'en';

    try {
      const detections = detect(cleanText);
      if (detections && detections.length > 0) {
        const topDetection = detections[0];
        if (topDetection.prob > 0.7) {
          return topDetection.lang;
        }
      }
      return 'en';
    } catch {
      return 'en';
    }
  }

  function getLanguageName(code) {
    const languages = {
      pt: 'Portuguese',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      ru: 'Russian',
      ja: 'Japanese',
      ko: 'Korean',
      zh: 'Chinese',
      en: 'English',
      und: 'Undetermined',
    };
    return languages[code] || code;
  }

  function scanDir(currentDir) {
    const items = fs.readdirSync(currentDir);

    items.forEach((item) => {
      const fullPath = path.join(currentDir, item);

      try {
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!shouldSkipDir(item)) {
            scanDir(fullPath);
          }
        } else if (extensions.includes(path.extname(item)) && !shouldSkipFile(item)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          const fileExt = path.extname(item).toLowerCase();

          lines.forEach((line, index) => {
            const trimmedLine = line.trim();

            if (trimmedLine.length === 0) return;

            const allTexts = [];

            allTexts.push(...extractComments(trimmedLine, fileExt));

            allTexts.push(...extractStrings(trimmedLine));

            if (['.html', '.jsx', '.tsx'].includes(fileExt)) {
              allTexts.push(...extractHtmlText(trimmedLine));
            }

            allTexts.forEach((textObj) => {
              const detectedLang = detectLanguage(textObj.content);

              if (detectedLang !== 'en' && getLanguageName(detectedLang).length !== 2) {
                nonEnglishTexts.push({
                  file: fullPath,
                  line: index + 1,
                  content: trimmedLine,
                  extractedText: textObj.content,
                  original: textObj.original,
                  type: textObj.type,
                  language: getLanguageName(detectedLang),
                  langCode: detectedLang,
                });
              }
            });
          });
        }
      } catch (err) {}
    });
  }

  scanDir(dir);

  if (nonEnglishTexts.length > 0) {
    console.log(
      `\n${colorize.error(`Found ${nonEnglishTexts.length} non-English text${nonEnglishTexts.length > 1 ? 's' : ''}:`)}\n`
    );

    const byType = {
      comment: [],
      string: [],
      'html-text': [],
    };

    nonEnglishTexts.forEach((text) => {
      byType[text.type].push(text);
    });

    Object.entries(byType).forEach(([type, texts]) => {
      if (texts.length === 0) return;

      console.log(
        `\n${colorize.highlight(`[${type.toUpperCase()}S]`)} ${colorize.dim(`(${texts.length} found)`)}`
      );
      console.log(`${colorize.dim('═'.repeat(60))}`);

      const byLanguage = texts.reduce((acc, text) => {
        if (!acc[text.language]) acc[text.language] = [];
        acc[text.language].push(text);
        return acc;
      }, {});

      Object.entries(byLanguage).forEach(([language, langTexts]) => {
        console.log(
          `\n${colorize.accent(language)} ${colorize.dim(`(${langTexts.length} ${type}${langTexts.length > 1 ? 's' : ''})`)}`
        );
        console.log(`${colorize.dim('─'.repeat(50))}`);

        langTexts.forEach((text) => {
          console.log(`${colorize.file(`${text.file}:${text.line}`)}`);
          console.log(
            `   ${colorize.dim(text.content.substring(0, 100))}${text.content.length > 100 ? '...' : ''}`
          );
          console.log(`   ${colorize.warning(`→ "${text.extractedText}"`)}`);
          console.log('');
        });
      });
    });

    console.log(`\n${colorize.highlight('[SUMMARY]')}`);
    console.log(`${colorize.dim('─'.repeat(50))}`);

    Object.entries(byType).forEach(([type, texts]) => {
      if (texts.length > 0) {
        const byLang = texts.reduce((acc, text) => {
          acc[text.language] = (acc[text.language] || 0) + 1;
          return acc;
        }, {});

        console.log(`\n${colorize.accent(type.toUpperCase() + 'S:')}`);
        Object.entries(byLang).forEach(([lang, count]) => {
          console.log(`   ${lang}: ${count}`);
        });
      }
    });

    console.log(`\n${colorize.error(`Total: ${nonEnglishTexts.length} non-English texts found`)}`);
  } else {
    console.log(`\n${colorize.success('[OK]')} No non-English texts found!`);
  }
}

findNonEnglishText();
