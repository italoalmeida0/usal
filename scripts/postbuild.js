import fs from 'fs';
import path from 'path';
import { colorize } from './colorize.js';

// Parse arguments from build script
const { projectName, packages, version } = JSON.parse(
  Buffer.from(process.argv[2], 'hex').toString('utf8')
);

console.log(`\n${colorize.header('[POSTBUILD]')} Updating README with package information...`);
console.log(`  ${colorize.info('Project:')} ${colorize.accent(projectName)}`);
console.log(
  `  ${colorize.info('Packages:')} ${packages.map((p) => colorize.package(p)).join(', ')}`
);

// Read the main README
const readmePath = 'README.md';
if (!fs.existsSync(readmePath)) {
  console.log(`  ${colorize.warning('[!]')} README.md not found, skipping updates`);
  process.exit(0);
}

let readme = fs.readFileSync(readmePath, 'utf-8');
const originalReadme = readme;

// Read package.json to get usage configs
const rootPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const packagesConfig = rootPackageJson.packages || {};
const frameworkApiItem = generateFrameworkAPIItem();

// 1. Update the "Works with" section
const frameworkNames = packages.map((pkg) => {
  if (pkg === 'vanilla') return 'Vanilla JS';
  return pkg.charAt(0).toUpperCase() + pkg.slice(1);
});

const sortedFrameworks = frameworkNames.filter((f) => f !== 'Vanilla JS');
if (frameworkNames.includes('Vanilla JS')) {
  sortedFrameworks.push('Vanilla JS');
}

const worksWithText = `Works with ${sortedFrameworks.join(', ')} and more`;

const worksWithRegex = /\*\*Works with[^*]+\*\*/g;
if (worksWithRegex.test(readme)) {
  readme = readme.replace(worksWithRegex, `**${worksWithText}**`);
  console.log(`  ${colorize.success('✓')} Updated ${colorize.update('"Works with"')} section`);
} else {
  console.log(`  ${colorize.warning('[!]')} ${colorize.update('"Works with"')} section not found`);
}

// 2. Update NPM installation section
const installSectionRegex = /(NPM\:\n\n```bash\nnpm install )[\s\S]*?(```)/;

if (installSectionRegex.test(readme)) {
  let installCommands = [];
  const frameworkPackages = packages
    .filter((pkg) => pkg !== 'vanilla')
    .map((pkg) => `npm install @${projectName}/${pkg}`);

  if (frameworkPackages.length > 0) {
    installCommands.push('# Framework-specific packages:');
    installCommands = installCommands.concat(frameworkPackages);
  }
  let replacement = `$1${projectName}\n\n${installCommands.join('\n')}\n$2`;
  readme = readme.replace(installSectionRegex, replacement);

  const setupSectionRegex = /(Framework Setup\:\n\n```javascript)[\s\S]*?(```)/;
  if (setupSectionRegex.test(readme)) {
    replacement = `$1\n${frameworkApiItem}\n$2`;
    readme = readme.replace(setupSectionRegex, replacement);
  }

  console.log(
    `  ${colorize.success('✓')} Updated ${colorize.update('NPM installation and Setup')} section`
  );
} else {
  console.log(
    `  ${colorize.warning('[!]')} NPM installation code block not found in expected format`
  );
}

// 3. Update Package Information section
const packageInfoContent = generatePackageInfoContent();
const packagesSectionRegex = /(## Packages)[\s\S]*?(## Installation)/;

if (packagesSectionRegex.test(readme)) {
  const replacement = `$1\n\n${packageInfoContent}\n$2`;
  readme = readme.replace(packagesSectionRegex, replacement);
  console.log(`  ${colorize.success('✓')} Updated ${colorize.update('Packages')} section content`);
} else {
  console.log(`  ${colorize.warning('[!]')} Could not find proper location for Packages section`);
}

// 4. Update usage examples with new format
const frameworkExamples = generateFrameworkExamples();

if (frameworkExamples.length > 0) {
  // Update README usage section
  const usageRegex = /(### data-usal\n\n> Main animation attribute\n\n```html\n)([\s\S]*?)(```)/;
  const usageMatch = readme.match(usageRegex);

  if (usageMatch) {
    const newContent = buildUsageContent(usageMatch[2], frameworkExamples, 'readme');
    readme = readme.replace(usageRegex, `$1${newContent}\n$3`);
    console.log(
      `  ${colorize.success('✓')} Updated ${colorize.update('usage examples')} section in README`
    );
  } else {
    console.log(`  ${colorize.warning('[!]')} Usage examples section not found in README`);
  }
}

// Save README updates
if (readme !== originalReadme) {
  fs.writeFileSync(readmePath, readme);
  console.log(
    `\n  ${colorize.highlight('[SUCCESS]')} ${colorize.file('README.md')} successfully updated!`
  );

  const vanillaReadmePath = path.join('packages', 'vanilla', 'README.md');
  if (fs.existsSync(vanillaReadmePath)) {
    fs.writeFileSync(vanillaReadmePath, readme);
    console.log(
      `  ${colorize.success('✓')} Also updated ${colorize.file('packages/vanilla/README.md')}`
    );
  }
} else {
  console.log(`\n  ${colorize.info('[i]')} No changes made to README.md`);
}

// 5. Update index.html
const indexPath = 'index.html';
if (fs.existsSync(indexPath)) {
  console.log(`\n${colorize.header('[HTML UPDATE]')} Processing index.html...`);

  let indexHtml = fs.readFileSync(indexPath, 'utf-8');
  const originalIndex = indexHtml;

  // Update installation section
  const installRegex = /(<code class="js"># Install[\s\S]*?)<\/code><\/pre>/;
  const match = indexHtml.match(installRegex);

  if (match) {
    let installCommands = [`# Install\nnpm install ${projectName}`];
    const frameworkPackages = packages
      .filter((pkg) => pkg !== 'vanilla')
      .map((pkg) => `npm install @${projectName}/${pkg}`);

    if (frameworkPackages.length > 0) {
      installCommands.push('\n# Framework-specific packages:');
      installCommands = installCommands.concat(frameworkPackages);
    }

    indexHtml = indexHtml.replace(
      installRegex,
      `<code class="js">${installCommands.join('\n')}</code></pre>`
    );
    console.log(
      `  ${colorize.success('✓')} Updated ${colorize.file('index.html')} installation section`
    );
  }

  // Update usage examples in HTML
  if (frameworkExamples.length > 0) {
    const htmlUsageRegex =
      /(<div class="animation-desc">Main animation attribute<\/div>\s*<pre><code class="html">)([\s\S]*?)(<\/code><\/pre>)/;
    const htmlUsageMatch = indexHtml.match(htmlUsageRegex);

    if (htmlUsageMatch) {
      const newContent = buildUsageContent(htmlUsageMatch[2], frameworkExamples, 'html');
      indexHtml = indexHtml.replace(htmlUsageRegex, `$1${newContent}\n$3`);
      console.log(
        `  ${colorize.success('✓')} Updated ${colorize.file('index.html')} usage examples`
      );
    }

    // Add framework examples to JavaScript API section (before USAL.config)
    const jsApiRegex =
      /(Installed via CDN, initializes automatically, instance in window\.USAL\n)[\s\S]*?(<\/code><\/pre>)/;
    const jsApiMatch = indexHtml.match(jsApiRegex);

    if (jsApiMatch) {
      indexHtml = indexHtml.replace(jsApiRegex, `$1\n${escapeHtml(frameworkApiItem)}$2`);
      console.log(
        `  ${colorize.success('✓')} Added framework examples to ${colorize.file('index.html')} JavaScript API section`
      );
    }
  }

  if (indexHtml !== originalIndex) {
    fs.writeFileSync(indexPath, indexHtml);
    console.log(
      `  ${colorize.highlight('[DONE]')} ${colorize.file('index.html')} successfully updated!`
    );
  } else {
    console.log(`  ${colorize.info('[i]')} No changes made to ${colorize.file('index.html')}`);
  }
}

console.log(`\n${colorize.success('==================================================')}`);
console.log(`${colorize.highlight('[POSTBUILD COMPLETE]')} All documentation updated!`);
console.log(`${colorize.success('==================================================')}\n`);

// Helper functions
function generatePackageInfoContent() {
  let content = '';
  content += `| Package | Description | Version |\n`;
  content += `|---------|-------------|---------|\n`;
  content += `| \`${projectName}\` | Core library (Vanilla JS) | ![npm](https://img.shields.io/npm/v/${projectName}) |\n`;

  packages
    .filter((pkg) => pkg !== 'vanilla')
    .forEach((pkg) => {
      const pkgName = `@${projectName}/${pkg}`;
      const framework = pkg.charAt(0).toUpperCase() + pkg.slice(1);
      content += `| \`${pkgName}\` | ${framework} integration | ![npm](https://img.shields.io/npm/v/${pkgName}) |\n`;
    });

  return content;
}

function generateFrameworkExamples() {
  const examples = [];

  // Add vanilla HTML first
  examples.push({
    framework: 'HTML',
    setup: '',
    example: '<div data-usal="fade duration-500">Content</div>',
    pseudonyms: [],
  });

  // Generate framework-specific examples
  for (const [framework, config] of Object.entries(packagesConfig)) {
    if (config.usage && framework !== 'vanilla') {
      const frameworkName = framework.charAt(0).toUpperCase() + framework.slice(1);

      let setup = '';
      if (config.usage.import && config.usage.start) {
        setup = `${config.usage.import}\n${config.usage.start}`;
      }

      let example = '';
      if (config.usage.prop) {
        const prop = config.usage.prop.replace('VALUES', 'fade duration-500');
        example = `<div ${prop}>Content</div>`;
      }

      examples.push({
        framework: frameworkName,
        setup: setup.trim(),
        example: example,
        pseudonyms: config.usage.pseudonym || [],
      });
    }
  }

  return examples;
}

function buildUsageContent(originalContent, frameworkExamples, format) {
  const lines = originalContent.split('\n');
  let cutIndex = lines.findIndex((line) => line.trim() === '');
  if (cutIndex === -1) cutIndex = Math.min(3, lines.length);

  let newContent = lines.slice(0, cutIndex).join('\n');

  if (frameworkExamples.length > 0) {
    newContent += '\n';

    if (format === 'html') {
      newContent += '\n&lt;!-- Framework-specific usage --&gt;';
      frameworkExamples.slice(1).forEach(({ framework, example, pseudonyms }) => {
        if (example) {
          // Show framework name with pseudonyms
          let frameworkLabel = framework;
          if (pseudonyms && pseudonyms.length > 0) {
            frameworkLabel += ` (${pseudonyms.join(', ')})`;
          }

          newContent += `\n&lt;!-- ${frameworkLabel} --&gt;`;
          newContent += '\n' + escapeHtml(example);
        }
      });
    } else {
      newContent += '\n<!-- Framework-specific usage -->';
      frameworkExamples.slice(1).forEach(({ framework, example, pseudonyms }) => {
        if (example) {
          // Show framework name with pseudonyms
          let frameworkLabel = framework;
          if (pseudonyms && pseudonyms.length > 0) {
            frameworkLabel += ` (${pseudonyms.join(', ')})`;
          }

          newContent += `\n<!-- ${frameworkLabel} -->`;
          newContent += `\n${example}`;
        }
      });
    }
  }

  return newContent;
}

function generateFrameworkAPIItem() {
  const examples = generateFrameworkExamples();

  let setupExamples = '';
  examples.forEach(({ framework, setup, pseudonyms }) => {
    if (setup && framework !== 'HTML') {
      let frameworkLabel = framework;
      if (pseudonyms && pseudonyms.length > 0) {
        frameworkLabel += ` (${pseudonyms.join(', ')})`;
      }
      setupExamples += `// ${frameworkLabel}\n${setup}\n\n`;
    }
  });

  return setupExamples.trim();
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
