import fs from 'fs';
import path from 'path';
import { detect } from 'langdetect';
import { colorize } from './colorize.js';

function findNonEnglishComments(dir = '.') {
  const extensions = ['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.md', '.json'];
  const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'packages'];
  const skipFiles = ['.lock', 'package-lock.json', 'yarn.lock'];

  const nonEnglishComments = [];

  // Common English technical words that should be considered English
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
  ];

  function shouldSkipDir(dirName) {
    return skipDirs.some((skip) => dirName.includes(skip)) || dirName.startsWith('.');
  }

  function shouldSkipFile(fileName) {
    return skipFiles.some((skip) => fileName.includes(skip));
  }

  function extractCommentText(line, fileExt) {
    let commentText = '';

    if (['.html', '.md'].includes(fileExt)) {
      // HTML/MD comments: <!-- comment -->
      const match = line.match(/<!--\s*(.*?)\s*-->/);
      if (match) commentText = match[1];
    } else {
      // JS/CSS comments: // comment or /* comment */
      if (line.includes('//')) {
        commentText = line.substring(line.indexOf('//') + 2).trim();
      } else if (line.includes('/*')) {
        const start = line.indexOf('/*') + 2;
        const end = line.includes('*/') ? line.indexOf('*/') : line.length;
        commentText = line.substring(start, end).trim();
      }
    }

    return commentText;
  }

  function isLikelyEnglish(text) {
    const words = text.toLowerCase().split(/\s+/);
    const techWordCount = words.filter(
      (word) =>
        englishTechWords.includes(word) || englishTechWords.includes(word.replace(/[^a-z]/g, ''))
    ).length;

    // If more than 30% are technical English words, consider it English
    return techWordCount / words.length > 0.3;
  }

  function detectLanguage(text) {
    // First check if it's likely English based on technical vocabulary
    if (isLikelyEnglish(text)) {
      return 'en';
    }

    // Clean text for better detection
    const cleanText = text
      .replace(/[{}()\[\];,.\-_=+*/\\]/g, ' ') // Remove symbols
      .replace(/\b[A-Z_]+\b/g, ' ') // Remove constants
      .replace(/\b\w+[A-Z]\w*\b/g, ' ') // Remove camelCase
      .replace(/\s+/g, ' ') // Clean whitespace
      .trim();

    // Skip very short texts
    if (cleanText.length < 12) return 'en'; // Assume short comments are English

    try {
      const detections = detect(cleanText);
      if (detections && detections.length > 0) {
        const topDetection = detections[0];
        // Only trust detection if confidence is high enough
        if (topDetection.prob > 0.7) {
          return topDetection.lang;
        }
      }
      return 'en'; // Default to English if uncertain
    } catch {
      return 'en'; // Default to English on error
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
            let hasComment = false;

            if (['.html', '.md'].includes(fileExt)) {
              hasComment = trimmedLine.includes('<!--');
            } else {
              hasComment = trimmedLine.includes('//') || trimmedLine.includes('/*');
            }

            if (hasComment && trimmedLine.length > 0) {
              const commentText = extractCommentText(trimmedLine, fileExt);

              if (commentText && commentText.length > 5) {
                const detectedLang = detectLanguage(commentText);

                // Only report non-English comments
                if (detectedLang !== 'en') {
                  nonEnglishComments.push({
                    file: fullPath,
                    line: index + 1,
                    content: trimmedLine,
                    commentText: commentText,
                    language: getLanguageName(detectedLang),
                    langCode: detectedLang,
                  });
                }
              }
            }
          });
        }
      } catch (err) {
        // Ignore file access errors
      }
    });
  }

  scanDir(dir);

  // Display results
  if (nonEnglishComments.length > 0) {
    console.log(
      `\n${colorize.error(`Found ${nonEnglishComments.length} non-English comment${nonEnglishComments.length > 1 ? 's' : ''}:`)}\n`
    );

    // Group by language
    const byLanguage = nonEnglishComments.reduce((acc, comment) => {
      if (!acc[comment.language]) acc[comment.language] = [];
      acc[comment.language].push(comment);
      return acc;
    }, {});

    Object.entries(byLanguage).forEach(([language, comments]) => {
      console.log(
        `${colorize.accent(language)} ${colorize.dim(`(${comments.length} comment${comments.length > 1 ? 's' : ''})`)}`
      );
      console.log(`${colorize.dim('─'.repeat(50))}`);

      comments.forEach((comment) => {
        console.log(`${colorize.file(`${comment.file}:${comment.line}`)}`);
        console.log(`   ${colorize.dim(comment.content)}`);
        console.log(`   ${colorize.warning(`→ "${comment.commentText}"`)}`);
        console.log('');
      });
    });

    // Summary
    console.log(`${colorize.highlight('[SUMMARY]')}`);
    Object.entries(byLanguage).forEach(([language, comments]) => {
      console.log(
        `   ${colorize.accent(language + ':')} ${comments.length} comment${comments.length > 1 ? 's' : ''}`
      );
    });
  } else {
    console.log(`\n${colorize.success('[OK]')} No non-English comments found!`);
  }
}

// Execute the function
findNonEnglishComments();
