import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { colorize } from './colorize.js';

// Parse arguments
const { projectName, packages, version } = JSON.parse(
  Buffer.from(process.argv[2], 'hex').toString('utf8')
);

console.log(`\n${colorize.header('[POSTBUILD]')} Starting documentation update process...`);
console.log(`  ${colorize.info('Project:')} ${colorize.accent(projectName)}`);
console.log(
  `  ${colorize.info('Packages:')} ${packages.map((p) => colorize.package(p)).join(', ')}`
);
console.log(`  ${colorize.info('Version:')} ${version}`);

// Track changes
let updateCount = 0;
let errorCount = 0;

// File paths
const files = {
  readme: 'README.md',
  index: 'index.html',
  vanilla: path.join('packages', 'vanilla', 'README.md'),
};

// Check README exists
if (!fs.existsSync(files.readme)) {
  console.log(`  ${colorize.error('[ERROR]')} README.md not found`);
  process.exit(1);
}

// Store original states
const originalStates = {};
Object.entries(files).forEach(([key, path]) => {
  if (fs.existsSync(path) && key !== 'vanilla') {
    originalStates[key] = fs.readFileSync(path, 'utf-8');
  }
});

// Get package config
const { packages: packagesConfig = {} } = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

// Generic update function
function updateContent(content, updates, fileName) {
  console.log(
    `\n${colorize.header(`[${fileName.toUpperCase()} UPDATE]`)} Processing ${fileName}...`
  );

  let result = content;
  updates.forEach(({ regex, replacement, name }) => {
    if (regex.test(result)) {
      result = result.replace(regex, replacement);
      console.log(`  ${colorize.success('[SUCCESS]')} ${name}`);
      updateCount++;
    } else {
      console.log(`  ${colorize.error('[ERROR]')} ${name} not found`);
      errorCount++;
    }
  });

  return result;
}

// Generate badge URL
function getBadgeUrl(packages = [], useNN = false, singlePackage = null, color = 'black') {
  const base = 'https://badge.usal.dev/';
  const prefix = useNN ? '?nn&' : '?';

  if (singlePackage) {
    return `${base}${prefix}p=${encodeURIComponent(singlePackage)}&color=${color}`;
  }
  if (packages.length > 0) {
    return `${base}${prefix}ps=${encodeURIComponent(packages.join(','))}`;
  }
  return base;
}

// Generate framework info
function getFrameworkInfo() {
  const frameworkPackages = packages
    .filter((pkg) => pkg !== 'vanilla')
    .map((pkg) => `@${projectName}/${pkg}`);

  const examples = [
    {
      framework: 'Vanilla JS',
      setup: '',
      example: '<div data-usal="fade duration-500">Content</div>',
      pseudonyms: [],
    },
  ];

  Object.entries(packagesConfig).forEach(([framework, config]) => {
    if (config.usage && framework !== 'vanilla') {
      const name = framework.charAt(0).toUpperCase() + framework.slice(1);
      const { import: imp, start, prop, pseudonym = [] } = config.usage;

      examples.push({
        framework: name,
        setup: [imp, start].filter(Boolean).join('\n').trim(),
        example: prop ? `<div ${prop.replace('VALUES', 'fade duration-500')}>Content</div>` : '',
        pseudonyms: pseudonym,
      });
    }
  });

  return { frameworkPackages, examples };
}

// Get all updates for a file
function getUpdates(fileType, info) {
  const { frameworkPackages, examples } = info;
  const updates = [];

  // Common updates
  const frameworks = packages.map((p) =>
    p === 'vanilla' ? 'Vanilla JS' : p.charAt(0).toUpperCase() + p.slice(1)
  );
  const sorted = [
    ...frameworks.filter((f) => f !== 'Vanilla JS'),
    ...(frameworks.includes('Vanilla JS') ? ['Vanilla JS'] : []),
  ];
  const worksWithText = `Works with ${sorted.join(', ')} and more`;

  if (fileType === 'readme') {
    // Update "Works with" section
    updates.push({
      regex: /\*\*Works with[^*]+\*\*/g,
      replacement: `**${worksWithText}**`,
      name: 'Works with section',
    });

    // NPM installation section
    const installCmds = [`npm install ${projectName}`];
    const frameworkInstalls = frameworkPackages.map((p) => {
      const framework = p.split('/')[1];
      const displayName = framework.charAt(0).toUpperCase() + framework.slice(1);
      const pseudonyms = packagesConfig[framework]?.usage?.pseudonym || [];
      const label = pseudonyms.length > 0 ? `${displayName}/${pseudonyms.join('/')}` : displayName;
      return `npm install ${p}   # For ${label}`;
    });

    if (frameworkInstalls.length > 0) {
      installCmds.push('', '# Framework-specific packages', ...frameworkInstalls);
    }

    updates.push({
      regex: /(### NPM\n\n```bash\n)([\s\S]*?)(```)/,
      replacement: `$1${installCmds.join('\n')}\n$3`,
      name: 'NPM installation',
    });

    // Framework Setup section - Update individual framework sections
    examples
      .filter((e) => e.setup && e.framework !== 'Vanilla JS')
      .forEach(({ framework, setup, pseudonyms }) => {
        const frameworkName = framework;
        const pseudonymText = pseudonyms.length > 0 ? ` \\(${pseudonyms.join('/')}\\)` : '';

        updates.push({
          regex: new RegExp(
            `(### ${frameworkName}${pseudonymText}\n\n\`\`\`jsx?\n)([\\s\\S]*?)(\`\`\`)`,
            'i'
          ),
          replacement: `$1${setup}\n$3`,
          name: `${frameworkName} setup`,
        });
      });

    // Framework Usage section
    const usageExamples = examples
      .map(({ framework, example, pseudonyms }) => {
        if (!example) return '';
        const label = pseudonyms.length > 0 ? `${framework}/${pseudonyms.join('/')}` : framework;
        return `<!-- ${label} -->\n${example}`;
      })
      .filter(Boolean)
      .join('\n\n');

    updates.push({
      regex: /(### Framework Usage\n\n```html\n)([\s\S]*?)(```)/,
      replacement: `$1${usageExamples}\n$3`,
      name: 'Framework usage examples',
    });

    // Package table in Packages Overview section
    let pkgTable = '| Package | Description | Version |\n|---------|-------------|---------|\n';
    pkgTable += `| \`${projectName}\` | Core library (Vanilla JS) | ![npm](${getBadgeUrl(frameworkPackages, true)}) |\n`;

    packages
      .filter((p) => p !== 'vanilla')
      .forEach((pkg) => {
        const name = `@${projectName}/${pkg}`;
        const framework = pkg.charAt(0).toUpperCase() + pkg.slice(1);
        const color = packagesConfig[pkg]?.usage?.color || 'grey';
        pkgTable += `| \`${name}\` | ${framework} integration | ![npm](${getBadgeUrl([], true, name, color)}) |\n`;
      });

    updates.push({
      regex: /(## 📊 Packages Overview\n\n)([\s\S]*?)(\n\n## )/,
      replacement: `$1${pkgTable}$3`,
      name: 'Package overview table',
    });
  }

  if (fileType === 'index' && fs.existsSync(files.index)) {
    // Installation commands
    const installCmds = [`# Install\nnpm install ${projectName}`];
    if (frameworkPackages.length > 0) {
      installCmds.push(
        '\n# Framework-specific packages:',
        ...frameworkPackages.map((p) => `npm install ${p}`)
      );
    }

    updates.push({
      regex: /(<code class="js"># Install[\s\S]*?)<\/code><\/pre>/,
      replacement: `<code class="js">${installCmds.join('\n')}</code></pre>`,
      name: 'Installation section',
    });

    // Usage examples HTML
    const htmlExamples = examples
      .map(({ framework, example, pseudonyms }) => {
        if (!example) return '';
        const label = pseudonyms.length > 0 ? `${framework}/${pseudonyms.join('/')}` : framework;
        const escapedExample = example.replace(
          /[<>"'&]/g,
          (m) => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' })[m]
        );
        return `&lt;!-- ${label} --&gt;\n${escapedExample}`;
      })
      .filter(Boolean)
      .join('\n\n');

    updates.push({
      regex:
        /(<div class="animation-desc">Main animation attribute<\/div>\s*<pre><code class="html">)([\s\S]*?)(<\/code><\/pre>)/,
      replacement: `$1${htmlExamples}\n$3`,
      name: 'Usage examples',
    });

    // JavaScript API
    const setupExamples = examples
      .filter((e) => e.setup && e.framework !== 'Vanilla JS')
      .map(({ framework, setup, pseudonyms }) => {
        const label = framework + (pseudonyms.length ? ` (${pseudonyms.join(', ')})` : '');
        return `// ${label}\n${setup}`;
      })
      .join('\n\n');

    updates.push({
      regex:
        /(Installed via CDN, initializes automatically, instance in window\.USAL\n)[\s\S]*?(<\/code><\/pre>)/,
      replacement: `$1\n${setupExamples.replace(
        /[<>"'&]/g,
        (m) => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' })[m]
      )}$2`,
      name: 'JavaScript API',
    });

    // Badges
    updates.push({
      regex: /(<div class="sidebar-version">)([\s\S]*?)(<\/div>)/,
      replacement: `$1\n  <img src="${getBadgeUrl(frameworkPackages)}" alt="${projectName} npm package">\n$3`,
      name: 'Main badge',
    });

    const badges = packages
      .filter((p) => p !== 'vanilla')
      .map((pkg) => {
        const name = `@${projectName}/${pkg}`;
        const color = packagesConfig[pkg]?.usage?.color || 'black';
        return `  <img src="${getBadgeUrl([], false, name, color)}" alt="${name} npm package">`;
      })
      .join('\n');

    updates.push({
      regex: /(<div class="badges">)[\s\S]*?(<\/div>)/,
      replacement: `$1\n${badges}\n$2`,
      name: 'Package badges',
    });
  }

  return updates;
}

// Process files
const info = getFrameworkInfo();
const processed = {};

Object.entries(originalStates).forEach(([key, content]) => {
  const updates = getUpdates(key, info);
  processed[key] = updateContent(content, updates, files[key]);
});

// Save files
Object.entries(processed).forEach(([key, content]) => {
  fs.writeFileSync(files[key], content);
  console.log(`  ${colorize.info('[SAVED]')} ${files[key]}`);
});

// Copy README to vanilla
if (processed.readme && fs.existsSync(path.dirname(files.vanilla))) {
  fs.writeFileSync(files.vanilla, processed.readme);
  console.log(`  ${colorize.info('[COPIED]')} README to vanilla package`);
}

// Format documents
console.log(`\n${colorize.header('[FORMAT]')} Running format...`);
try {
  execSync('npm run format', { stdio: 'pipe' });
  console.log(`  ${colorize.success('[SUCCESS]')} Formatted`);
} catch {
  console.log(`  ${colorize.warning('[WARNING]')} Format failed`);
}

// Check changes
console.log(`\n${colorize.header('[COMPARISON]')} Checking changes...`);
const changes = [];

Object.entries(originalStates).forEach(([key, original]) => {
  const current = fs.readFileSync(files[key], 'utf-8');
  const status = current !== original ? 'CHANGED' : 'NO CHANGE';
  const color = current !== original ? 'success' : 'info';

  console.log(`  ${colorize[color](`[${status}]`)} ${files[key]}`);
  if (current !== original) changes.push(files[key]);
});

// Summary
console.log(`\n${colorize.success('==================================================')}`);
if (changes.length === 0) {
  console.log(`${colorize.info('[POSTBUILD COMPLETE]')} All files up to date!`);
} else if (errorCount > 0) {
  console.log(`${colorize.warning('[POSTBUILD COMPLETE WITH WARNINGS]')}`);
  console.log(`  ${colorize.success('Updated:')} ${changes.join(', ')}`);
  console.log(`  ${colorize.error('Errors:')} ${errorCount}`);
} else {
  console.log(`${colorize.highlight('[POSTBUILD SUCCESS]')}`);
  console.log(`  ${colorize.success('Updated:')} ${changes.join(', ')}`);
  console.log(`  ${colorize.success('Processed:')} ${updateCount} sections`);
}
console.log(`${colorize.success('==================================================')}\n`);

process.exit(errorCount > 2 ? 1 : 0);
