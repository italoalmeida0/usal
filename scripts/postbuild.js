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

// 1. Update the "Works with" section
const frameworkNames = packages.map((pkg) => {
  if (pkg === 'vanilla') return 'Vanilla JS';
  // Capitalize framework names
  return pkg.charAt(0).toUpperCase() + pkg.slice(1);
});

// Sort to put Vanilla JS at the end if it exists
const sortedFrameworks = frameworkNames.filter((f) => f !== 'Vanilla JS');
if (frameworkNames.includes('Vanilla JS')) {
  sortedFrameworks.push('Vanilla JS');
}

// Create the "Works with" text
const worksWithText = `Works with ${sortedFrameworks.join(', ')} and more`;

// Replace the existing "Works with" pattern
const worksWithRegex = /\*\*Works with[^*]+\*\*/g;
if (worksWithRegex.test(readme)) {
  readme = readme.replace(worksWithRegex, `**${worksWithText}**`);
  console.log(`  ${colorize.success('✓')} Updated ${colorize.update('"Works with"')} section`);
} else {
  console.log(`  ${colorize.warning('[!]')} ${colorize.update('"Works with"')} section not found`);
}

// 2. Update NPM installation section
// Find the npm install section
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
  const replacement = `$1${projectName}\n\n${installCommands.join('\n')}\n$2`;
  readme = readme.replace(installSectionRegex, replacement);
  console.log(`  ${colorize.success('✓')} Updated ${colorize.update('NPM installation')} section`);
} else {
  console.log(
    `  ${colorize.warning('[!]')} NPM installation code block not found in expected format`
  );
}

// 3. Update Package Information section between ## Packages and ## Installation
const packageInfoContent = generatePackageInfoContent();

// Look for ## Packages followed by anything until ## Installation
const packagesSectionRegex = /(## Packages)[\s\S]*?(## Installation)/;

if (packagesSectionRegex.test(readme)) {
  // Replace everything between ## Packages and ## Installation
  const replacement = `$1\n\n${packageInfoContent}\n$2`;
  readme = readme.replace(packagesSectionRegex, replacement);
  console.log(`  ${colorize.success('✓')} Updated ${colorize.update('Packages')} section content`);
} else {
  console.log(`  ${colorize.warning('[!]')} Could not find proper location for Packages section`);
}

// Function to generate package info content (just the content, not the header)
function generatePackageInfoContent() {
  let content = '';

  // Main package
  content += `| Package | Description | Version |\n`;
  content += `|---------|-------------|---------|\n`;
  content += `| \`${projectName}\` | Core library (Vanilla JS) | ![npm](https://img.shields.io/npm/v/${projectName}) |\n`;

  // Framework packages
  packages
    .filter((pkg) => pkg !== 'vanilla')
    .forEach((pkg) => {
      const pkgName = `@${projectName}/${pkg}`;
      const framework = pkg.charAt(0).toUpperCase() + pkg.slice(1);
      content += `| \`${pkgName}\` | ${framework} integration | ![npm](https://img.shields.io/npm/v/${pkgName}) |\n`;
    });

  return content;
}

// 4. Update usage examples in README and index.html
const rootPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const frameworkUsages = getFrameworkUsages();

if (frameworkUsages.length > 0) {
  // Update README
  const usageRegex = /(### data-usal\n\n> Main animation attribute\n\n```html\n)([\s\S]*?)(```)/;
  const usageMatch = readme.match(usageRegex);

  if (usageMatch) {
    const newContent = buildUsageContent(usageMatch[2], frameworkUsages, false);
    readme = readme.replace(usageRegex, `$1${newContent}\n$3`);
    console.log(
      `  ${colorize.success('✓')} Updated ${colorize.update('usage examples')} section in README`
    );
  } else {
    console.log(`  ${colorize.warning('[!]')} Usage examples section not found in README`);
  }
}

// Save README updates before processing HTML
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

// 5. Update index.html if it exists
const indexPath = 'index.html';
if (fs.existsSync(indexPath)) {
  console.log(`\n${colorize.header('[HTML UPDATE]')} Processing index.html...`);

  let indexHtml = fs.readFileSync(indexPath, 'utf-8');
  const originalIndex = indexHtml;

  // Update installation section (existing code)
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

  // Update usage examples
  if (frameworkUsages.length > 0) {
    const htmlUsageRegex =
      /(<div class="animation-desc">Main animation attribute<\/div>\s*<pre><code class="html">)([\s\S]*?)(<\/code><\/pre>)/;
    const htmlUsageMatch = indexHtml.match(htmlUsageRegex);

    if (htmlUsageMatch) {
      const newContent = buildUsageContent(htmlUsageMatch[2], frameworkUsages, true);
      indexHtml = indexHtml.replace(htmlUsageRegex, `$1${newContent}\n$3`);
      console.log(
        `  ${colorize.success('✓')} Updated ${colorize.file('index.html')} usage examples`
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
function getFrameworkUsages() {
  const usages = [];
  const packagesConfig = rootPackageJson.packages || {};

  for (const [framework, config] of Object.entries(packagesConfig)) {
    if (config.usage) {
      usages.push({
        framework: framework.charAt(0).toUpperCase() + framework.slice(1),
        pattern: config.usage.replace('VALUES', 'fade duration-500'),
      });
    }
  }
  return usages;
}

function buildUsageContent(originalContent, frameworkUsages, isHtml = false) {
  const lines = originalContent.split('\n');
  let cutIndex = lines.findIndex((line) => line.trim() === '');
  if (cutIndex === -1) cutIndex = Math.min(3, lines.length);

  let newContent = lines.slice(0, cutIndex).join('\n');

  if (frameworkUsages.length > 0) {
    newContent += '\n\n';

    if (isHtml) {
      newContent += '&lt;!-- Framework-specific usage --&gt;';
      frameworkUsages.forEach(({ framework, pattern }) => {
        newContent += `\n&lt;!-- ${framework} --&gt;`;
        newContent +=
          '\n' +
          `&lt;div ${pattern}&gt;Content&lt;/div&gt;`
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
      });
    } else {
      newContent += '<!-- Framework-specific usage -->';
      frameworkUsages.forEach(({ framework, pattern }) => {
        newContent += `\n<!-- ${framework} -->`;
        newContent += `\n<div ${pattern}>Content</div>`;
      });
    }
  }

  return newContent;
}
