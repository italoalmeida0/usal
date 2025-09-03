import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { colorize } from './colorize.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper function to run commands
function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

// Detect package manager
function detectPackageManager() {
  if (fs.existsSync('pnpm-lock.yaml')) return 'pnpm';
  if (fs.existsSync('yarn.lock')) return 'yarn';
  return 'npm';
}

// read package.json root
let rootPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

// Extract project name from monorepo name (e.g., "usal-monorepo" -> "usal")
const PROJECT_NAME = rootPackageJson.name.split('-monorepo')[0];

// Ensure devDependencies exist
if (!rootPackageJson.devDependencies) {
  rootPackageJson.devDependencies = {};
}

// Collect and add required devDependencies
async function setupDevDependencies() {
  const packagesConfig = rootPackageJson.packages || {};
  let hasChanges = false;

  console.log(`\n${colorize.header('[DEPENDENCIES CHECK]')} Scanning required devDependencies...`);

  // Always ensure esbuild is present
  if (!rootPackageJson.devDependencies.esbuild) {
    rootPackageJson.devDependencies.esbuild = '^0.19.0';
    hasChanges = true;
    console.log(`  ${colorize.success('+')} Added ${colorize.package('esbuild')}`);
  }

  // Add TypeScript if we detect .ts files
  const hasTypeScriptFiles =
    fs.existsSync('src') &&
    (fs
      .readdirSync('src', { recursive: true })
      .some((file) => typeof file === 'string' && file.endsWith('.ts')) ||
      (fs.existsSync('src/integrations') &&
        fs.readdirSync('src/integrations').some((file) => file.endsWith('.ts'))));

  if (hasTypeScriptFiles && !rootPackageJson.devDependencies.typescript) {
    rootPackageJson.devDependencies.typescript = '^5.0.0';
    hasChanges = true;
    console.log(
      `  ${colorize.success('+')} Added ${colorize.package('typescript')} ${colorize.dim('(detected .ts files)')}`
    );
  }

  // For each framework package, add its dependencies as dev dependencies
  for (const [framework, config] of Object.entries(packagesConfig)) {
    if (framework === 'vanilla') continue;

    // Process dependencies with new format: { "package": ["version", isOptional] }
    if (config.dependencies) {
      for (const [dep, depConfig] of Object.entries(config.dependencies)) {
        const [version, isOptional] = Array.isArray(depConfig) ? depConfig : [depConfig, false];

        // Add to devDependencies if not present (we need them for building)
        if (!rootPackageJson.devDependencies[dep]) {
          rootPackageJson.devDependencies[dep] = version;
          hasChanges = true;
          console.log(
            `  ${colorize.success('+')} Added ${colorize.package(dep)}@${colorize.info(version)}`
          );
        }
      }
    }
  }

  // Save updated package.json if changes were made
  if (hasChanges) {
    fs.writeFileSync('package.json', JSON.stringify(rootPackageJson, null, 2));
    console.log(
      `\n${colorize.success('[SUCCESS]')} Updated package.json with required devDependencies`
    );

    // Run npm install
    console.log(`\n${colorize.info('[INSTALLING]')} Installing dependencies...`);
    const packageManager = detectPackageManager();
    await runCommand(packageManager, ['install'], process.cwd());
    console.log(`${colorize.success('[COMPLETE]')} Dependencies installed\n`);

    // Reload package.json after install
    rootPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  } else {
    console.log(`${colorize.success('[OK]')} All required devDependencies already present`);
  }
}

// Clean packages directory
if (fs.existsSync('packages')) {
  fs.rmSync('packages', { recursive: true });
}
fs.mkdirSync('packages');

// Config builds
const buildConfig = {
  bundle: true,
  sourcemap: true,
  target: ['es6'],
  // Add TypeScript loader support
  loader: {
    '.ts': 'ts',
    '.tsx': 'tsx',
  },
};

// README
function createPackageReadme(framework) {
  const packageName = framework === 'vanilla' ? PROJECT_NAME : `@${PROJECT_NAME}/${framework}`;
  const frameworkCapitalized = framework.charAt(0).toUpperCase() + framework.slice(1);
  const description =
    framework === 'vanilla'
      ? rootPackageJson.description
      : `${rootPackageJson.description} | ${frameworkCapitalized} Package`;

  return `# ${packageName}

${description}

## Installation

\`\`\`bash
npm install ${packageName}
\`\`\`

## Documentation

Visit [${rootPackageJson.homepage}](${rootPackageJson.homepage})
`;
}

// Create sub-package package.json
function createSubPackageJson(framework, config = {}) {
  const packageName = framework === 'vanilla' ? PROJECT_NAME : `@${PROJECT_NAME}/${framework}`;
  const description =
    framework === 'vanilla'
      ? rootPackageJson.description
      : `${rootPackageJson.description} | ${framework.charAt(0).toUpperCase() + framework.slice(1)} Package`;

  const packageJson = {
    name: packageName,
    version: rootPackageJson.version,
    type: 'module',
    description: description,
    homepage: rootPackageJson.homepage,
    repository: {
      ...rootPackageJson.repository,
      directory: `packages/${framework}`,
    },
    bugs: rootPackageJson.bugs,
    author: rootPackageJson.author,
    license: rootPackageJson.license,
    main: './index.cjs.js',
    module: './index.esm.js',
    types: './index.d.ts',
    exports: {
      '.': {
        types: './index.d.ts',
        import: './index.esm.js',
        require: './index.cjs.js',
      },
    },
    files: ['*.js', '*.d.ts', 'README.md', 'LICENSE'],
    keywords: [...rootPackageJson.keywords, framework === 'vanilla' ? null : framework].filter(
      Boolean
    ),
    sideEffects: false,
  };

  // Process dependencies with new format
  if (config.dependencies) {
    const peerDeps = {};
    const peerDepsMeta = {};

    for (const [dep, depConfig] of Object.entries(config.dependencies)) {
      const [version, isOptional] = Array.isArray(depConfig) ? depConfig : [depConfig, false];
      peerDeps[dep] = version;
      peerDepsMeta[dep] = { optional: isOptional };
    }

    if (Object.keys(peerDeps).length > 0) {
      packageJson.peerDependencies = peerDeps;
      packageJson.peerDependenciesMeta = peerDepsMeta;
    }
  }

  // Vanilla builds UMD/IIFE
  if (framework === 'vanilla') {
    packageJson.browser = `./${PROJECT_NAME}.umd.js`;
    packageJson.unpkg = `./${PROJECT_NAME}.min.js`;
    packageJson.jsdelivr = `./${PROJECT_NAME}.min.js`;
    packageJson.exports['.'] = {
      types: './index.d.ts',
      browser: `./${PROJECT_NAME}.umd.js`,
      import: './index.esm.js',
      require: './index.cjs.js',
    };
  }

  return packageJson;
}

// Helper function to find entry file with multiple extensions
function findEntryFile(basePath, extensions) {
  for (const ext of extensions) {
    const filePath = `${basePath}${ext}`;
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

async function buildFrameworkPackage(name, config = {}) {
  const packageDir = path.join('packages', name);
  fs.mkdirSync(packageDir, { recursive: true });

  // Adjust name for console
  const displayName = name === 'vanilla' ? PROJECT_NAME : `@${PROJECT_NAME}/${name}`;
  console.log(`\n${colorize.box('BUILDING')} ${colorize.package(displayName)}`);

  let entryFile = config.entry;

  // If no entry specified, try to find it
  if (!entryFile) {
    const basePath = `src/integrations/${name}`;

    // Determine which extensions to check based on jsx flag
    const extensions =
      config.jsx === true
        ? ['.tsx', '.ts', '.jsx', '.js'] // Prioritize TSX/JSX when jsx is enabled
        : ['.ts', '.js']; // Standard extensions

    entryFile = findEntryFile(basePath, extensions);

    if (entryFile) {
      console.log(`  ${colorize.info('→')} Found entry: ${colorize.file(entryFile)}`);
    }
  }

  if (!entryFile || !fs.existsSync(entryFile)) {
    console.log(
      `  ${colorize.warning('[!]')} Skipping - no entry file found for ${colorize.package(name)}`
    );
    if (!config.entry) {
      const extensions = config.jsx === true ? '.tsx, .ts, .jsx, .js' : '.ts, .js';
      console.log(`     ${colorize.dim(`Searched: src/integrations/${name}{${extensions}}`)}`);
    }
    return;
  }

  const buildOptions = {
    ...buildConfig,
    entryPoints: [entryFile],
  };

  // Extract external dependencies from config.dependencies
  if (config.dependencies) {
    buildOptions.external = Object.keys(config.dependencies);
  }

  // Add any additional external from config
  if (config.external) {
    buildOptions.external = [...(buildOptions.external || []), ...config.external];
  }

  // Special handling for JSX/TSX
  if (config.jsx === true) {
    buildOptions.loader = {
      '.js': 'jsx',
      '.jsx': 'jsx',
      '.ts': 'tsx', // Treat .ts as .tsx when jsx flag is true
      '.tsx': 'tsx',
    };
    buildOptions.jsx = 'automatic';
    console.log(`  ${colorize.accent('◆')} JSX enabled for this package`);
  }

  // Build ESM
  await esbuild.build({
    ...buildOptions,
    format: 'esm',
    outfile: path.join(packageDir, 'index.esm.js'),
  });
  console.log(`  ${colorize.success('✓')} ESM build complete`);

  // Build CJS
  await esbuild.build({
    ...buildOptions,
    format: 'cjs',
    outfile: path.join(packageDir, 'index.cjs.js'),
  });
  console.log(`  ${colorize.success('✓')} CJS build complete`);

  // For vanilla, build UMD formats
  if (name === 'vanilla') {
    const globalName = PROJECT_NAME.toUpperCase();

    await esbuild.build({
      ...buildOptions,
      format: 'iife',
      globalName: globalName,
      outfile: path.join(packageDir, `${PROJECT_NAME}.umd.js`),
    });
    console.log(`  ${colorize.success('✓')} UMD build complete`);

    await esbuild.build({
      ...buildOptions,
      format: 'iife',
      globalName: globalName,
      minify: true,
      sourcemap: false,
      outfile: path.join(packageDir, `${PROJECT_NAME}.min.js`),
    });
    console.log(`  ${colorize.success('✓')} UMD minified build complete`);
  }

  // Copy TypeScript definitions
  const typeFile =
    config.types ||
    (name === 'vanilla' ? `src/types/${PROJECT_NAME}.d.ts` : `src/types/${name}.d.ts`);

  if (name !== 'vanilla' && fs.existsSync(`src/types/${PROJECT_NAME}.d.ts`)) {
    fs.copyFileSync(
      `src/types/${PROJECT_NAME}.d.ts`,
      path.join(packageDir, `${PROJECT_NAME}.d.ts`)
    );
  }

  if (fs.existsSync(typeFile)) {
    fs.copyFileSync(typeFile, path.join(packageDir, 'index.d.ts'));
    console.log(`  ${colorize.success('✓')} TypeScript definitions copied`);
  }

  // Create package.json
  const packageJson = createSubPackageJson(name, config);
  fs.writeFileSync(path.join(packageDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  console.log(`  ${colorize.success('✓')} package.json created`);

  // Create README
  if (name === 'vanilla' && fs.existsSync('README.md')) {
    fs.copyFileSync('README.md', path.join(packageDir, 'README.md'));
    console.log(`  ${colorize.success('✓')} README.md copied from root`);
  } else {
    const readme = createPackageReadme(name);
    fs.writeFileSync(path.join(packageDir, 'README.md'), readme);
    console.log(`  ${colorize.success('✓')} README.md created`);
  }

  // Copy LICENSE
  if (fs.existsSync('LICENSE')) {
    fs.copyFileSync('LICENSE', path.join(packageDir, 'LICENSE'));
    console.log(`  ${colorize.success('✓')} LICENSE copied`);
  }

  console.log(
    `  ${colorize.highlight('[DONE]')} ${colorize.package(displayName)} package complete!`
  );
}

async function build() {
  console.log(`\n${colorize.header('==================================================')}`);
  console.log(`${colorize.highlight(`BUILDING ${PROJECT_NAME.toUpperCase()} MONOREPO PACKAGES`)}`);
  console.log(`${colorize.header('==================================================')}`);
  console.log(`${colorize.info('Version:')} ${colorize.accent(rootPackageJson.version)}`);
  console.log(`${colorize.info('Project:')} ${colorize.accent(PROJECT_NAME)}`);
  console.log(`${colorize.divider('--------------------------------------------------')}\n`);

  // Setup devDependencies and install if needed
  await setupDevDependencies();

  // Track all built packages
  const builtPackages = [];

  // Build vanilla package
  const vanillaConfig = rootPackageJson.packages?.vanilla || {};
  await buildFrameworkPackage('vanilla', {
    entry: `src/${PROJECT_NAME}.js`,
    ...vanillaConfig,
  });
  builtPackages.push('vanilla');

  // Build framework packages from config
  const packagesConfig = rootPackageJson.packages || {};

  for (const [frameworkName, config] of Object.entries(packagesConfig)) {
    if (frameworkName === 'vanilla') continue; // Already built
    await buildFrameworkPackage(frameworkName, config);
    builtPackages.push(frameworkName);
  }

  console.log(`\n${colorize.brightGreen('==================================================')}`);
  console.log(`${colorize.success('[SUCCESS]')} All builds complete!`);
  console.log(
    `${colorize.header('[LOCATION]')} Packages ready in ${colorize.file('./packages')} directory`
  );
  console.log(`\n${colorize.accent('To publish all packages:')}`);
  console.log(`  ${colorize.command('npm run publish-all')}`);
  console.log(`\n${colorize.accent('To publish individually:')}`);
  console.log(`  ${colorize.command('cd packages/[framework] && npm publish --tag beta')}`);
  console.log(`${colorize.brightGreen('==================================================')}`);

  // Run postbuild script if exists
  if (fs.existsSync('postbuild.js')) {
    console.log(`\n${colorize.info('[POSTBUILD]')} Running postbuild.js...`);
    try {
      const postbuildData = {
        projectName: PROJECT_NAME,
        packages: builtPackages,
        version: rootPackageJson.version,
      };
      const jsonString = JSON.stringify(postbuildData);

      await runCommand(
        'node',
        ['postbuild.js', Buffer.from(jsonString).toString('hex')],
        process.cwd()
      );

      console.log(`${colorize.success('[OK]')} Postbuild script completed successfully`);
    } catch (error) {
      console.error(`${colorize.warning('[WARNING]')} Postbuild script error:`, error.message);
      // Don't fail the build if postbuild script fails
    }
  }
}

build().catch((error) => {
  console.error(`${colorize.error('[ERROR]')} Build failed:`, error);
  process.exit(1);
});
