#!/usr/bin/env node
/* eslint-disable no-empty */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import esbuild from 'esbuild';

import { colorize } from './colorize.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

function detectPackageManager() {
  if (fs.existsSync('pnpm-lock.yaml')) return 'pnpm';
  if (fs.existsSync('yarn.lock')) return 'yarn';
  return 'npm';
}

let rootPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const PROJECT_NAME = rootPackageJson.name.split('-monorepo')[0];

if (!rootPackageJson.devDependencies) {
  rootPackageJson.devDependencies = {};
}

const buildConfig = {
  bundle: true,
  sourcemap: true,
  target: ['es6'],
  loader: {
    '.ts': 'ts',
    '.tsx': 'tsx',
  },
};

async function setupDevDependencies() {
  const packagesConfig = rootPackageJson.packages || {};
  let hasChanges = false;

  console.log(`\n${colorize.header('[DEPENDENCIES CHECK]')} Scanning required devDependencies...`);

  if (!rootPackageJson.devDependencies.esbuild) {
    rootPackageJson.devDependencies.esbuild = '^0.19.0';
    hasChanges = true;
    console.log(`  ${colorize.success('+')} Added ${colorize.package('esbuild')}`);
  }

  const hasAngularPackage = Object.keys(packagesConfig).some(
    (pkg) => packagesConfig[pkg].format === 'angular'
  );
  if (hasAngularPackage && !rootPackageJson.devDependencies['ng-packagr']) {
    rootPackageJson.devDependencies['ng-packagr'] = '^18.0.0';
    hasChanges = true;
    console.log(
      `  ${colorize.success('+')} Added ${colorize.package('ng-packagr')} ${colorize.dim('(for Angular builds)')}`
    );
  }

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

  if (hasAngularPackage) {
    const angularDeps = {
      '@angular/compiler': '^20.2.3',
      '@angular/compiler-cli': '^20.2.3',
    };

    for (const [dep, version] of Object.entries(angularDeps)) {
      if (!rootPackageJson.devDependencies[dep]) {
        rootPackageJson.devDependencies[dep] = version;
        hasChanges = true;
        console.log(
          `  ${colorize.success('+')} Added ${colorize.package(dep)} ${colorize.dim('(required for ng-packagr)')}`
        );
      }
    }
  }

  for (const [framework, config] of Object.entries(packagesConfig)) {
    if (framework === 'vanilla') continue;

    if (config.dependencies) {
      for (const [dep, depConfig] of Object.entries(config.dependencies)) {
        const version = Array.isArray(depConfig) ? depConfig[0] : depConfig;

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

  if (hasChanges) {
    fs.writeFileSync('package.json', JSON.stringify(rootPackageJson, null, 2));
    console.log(
      `\n${colorize.success('[SUCCESS]')} Updated package.json with required devDependencies`
    );

    console.log(`\n${colorize.info('[INSTALLING]')} Installing dependencies...`);
    const packageManager = detectPackageManager();
    await runCommand(packageManager, ['install', '--legacy-peer-deps'], process.cwd());
    console.log(`${colorize.success('[COMPLETE]')} Dependencies installed\n`);

    rootPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  } else {
    console.log(`${colorize.success('[OK]')} All required devDependencies already present`);
  }
}

if (fs.existsSync('packages')) {
  fs.rmSync('packages', { recursive: true });
}
fs.mkdirSync('packages');

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

const createExportMap = (entryName, baseFileName, config) => {
  if (config.format === 'angular') {
    const isMainEntry = entryName === '.';
    return {
      types: isMainEntry ? './index.d.ts' : `./${baseFileName}/index.d.ts`,
      default: `./fesm2022/${baseFileName}.mjs`,
    };
  }
  return entryName === '.'
    ? { types: './index.d.ts', import: './index.esm.js', require: './index.cjs' }
    : `./${baseFileName}.js`;
};

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
    main: './index.cjs',
    module: './index.esm.js',
    types: './index.d.ts',
    exports: {},
    files: ['*.cjs', '*.js', '*.map', '*.ts', 'README.md', 'LICENSE'],
    keywords: [...rootPackageJson.keywords, framework === 'vanilla' ? null : framework].filter(
      Boolean
    ),
    sideEffects: false,
  };

  if (config.format === 'angular') {
    packageJson.module = `./fesm2022/${PROJECT_NAME}.mjs`;
    delete packageJson.main;
    packageJson.files.push('fesm2022/');
  }

  packageJson.exports['.'] = createExportMap('.', PROJECT_NAME, config);

  if (config.format === 'angular') {
    packageJson.exports['./core'] = {
      types: './core/index.d.ts',
      default: './fesm2022/core.mjs',
    };
    packageJson.exports['./package.json'] = {
      default: './package.json',
    };
    packageJson.files.push('core/');
  }

  if (config.plugins && Array.isArray(config.plugins)) {
    for (const pluginName of config.plugins) {
      packageJson.exports[`./${pluginName}`] = createExportMap(
        `./${pluginName}`,
        pluginName,
        config
      );

      if (config.format === 'angular') {
        if (!packageJson.files.includes(`${pluginName}/`)) {
          packageJson.files.push(`${pluginName}/`);
        }
      } else {
        if (!packageJson.files.includes(`${pluginName}.js`)) {
          packageJson.files.push(`${pluginName}.js`);
        }
      }
    }
  }

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

  if (framework === 'vanilla') {
    packageJson.browser = `./${PROJECT_NAME}.umd.js`;
    packageJson.unpkg = `./${PROJECT_NAME}.min.js`;
    packageJson.jsdelivr = `./${PROJECT_NAME}.min.js`;
    packageJson.exports['.'] = {
      types: './index.d.ts',
      browser: `./${PROJECT_NAME}.umd.js`,
      import: './index.esm.js',
      require: './index.cjs',
    };
  }

  return packageJson;
}

function findEntryFile(basePath, extensions) {
  for (const ext of extensions) {
    const filePath = `${basePath}${ext}`;
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

async function postProcessAngularBuild(packageDir, framework) {
  console.log(`  ${colorize.info('→')} Post-processing Angular build files...`);

  try {
    const fesm2022Dir = path.join(packageDir, 'fesm2022');
    if (fs.existsSync(fesm2022Dir)) {
      const files = fs.readdirSync(fesm2022Dir);

      for (const file of files) {
        if (file.includes(rootPackageJson.name)) {
          const oldPath = path.join(fesm2022Dir, file);
          const newFileName = file.replace(rootPackageJson.name, PROJECT_NAME);
          const newPath = path.join(fesm2022Dir, newFileName);

          fs.renameSync(oldPath, newPath);
          console.log(`    ${colorize.success('✓')} Renamed: ${file} → ${newFileName}`);

          let content = fs.readFileSync(newPath, 'utf-8');
          if (newFileName.endsWith('.mjs')) {
            content = content.replace(
              new RegExp(`from '~/${PROJECT_NAME}'`, 'g'),
              `from '@${PROJECT_NAME}/${framework}/core'`
            );
          } else if (newFileName.endsWith('.map')) {
            content = content.replace(new RegExp(rootPackageJson.name, 'g'), PROJECT_NAME);
            const mapObj = JSON.parse(content);
            mapObj.sources = [`./${PROJECT_NAME}.mjs`, './core.mjs'];
            content = JSON.stringify(mapObj);
          }
          fs.writeFileSync(newPath, content);
        }
      }
    }

    const coreDir = path.join(packageDir, 'core');
    fs.mkdirSync(coreDir, { recursive: true });

    const vanillaTypesPath = path.join('packages', 'vanilla', 'index.d.ts');
    if (fs.existsSync(vanillaTypesPath)) {
      const typesContent = fs.readFileSync(vanillaTypesPath, 'utf-8');
      fs.writeFileSync(path.join(coreDir, 'index.d.ts'), typesContent);
      console.log(`    ${colorize.success('✓')} Created core/index.d.ts`);
    }

    const vanillaEsmPath = path.join('packages', 'vanilla', 'index.esm.js');
    if (fs.existsSync(vanillaEsmPath)) {
      let esmContent = fs.readFileSync(vanillaEsmPath, 'utf-8');
      esmContent = esmContent.replace(
        new RegExp(`from '~/${PROJECT_NAME}'`, 'g'),
        `from '@${PROJECT_NAME}/${framework}/core'`
      );

      // Fix sourceMappingURL
      esmContent = esmContent.replace(
        /\/\/# sourceMappingURL=.*\.map/g,
        '//# sourceMappingURL=core.mjs.map'
      );

      fs.writeFileSync(path.join(fesm2022Dir, 'core.mjs'), esmContent);
      console.log(`    ${colorize.success('✓')} Created fesm2022/core.mjs`);

      // Copy and rename the map file
      const vanillaMapPath = path.join('packages', 'vanilla', 'index.esm.js.map');
      if (fs.existsSync(vanillaMapPath)) {
        let mapContent = fs.readFileSync(vanillaMapPath, 'utf-8');

        // Update map content references
        mapContent = mapContent.replace(/index\.esm\.js/g, 'core.mjs');

        const mapObj = JSON.parse(mapContent);
        mapObj.sources = [`./core.mjs`];
        mapContent = JSON.stringify(mapObj);

        fs.writeFileSync(path.join(fesm2022Dir, 'core.mjs.map'), mapContent);
        console.log(`    ${colorize.success('✓')} Created fesm2022/core.mjs.map`);
      }
    }

    const indexDtsPath = path.join(packageDir, 'index.d.ts');
    if (fs.existsSync(indexDtsPath)) {
      let content = fs.readFileSync(indexDtsPath, 'utf-8');
      content = content.replace(
        new RegExp(`from '~/${PROJECT_NAME}'`, 'g'),
        `from '@${PROJECT_NAME}/${framework}/core'`
      );
      fs.writeFileSync(indexDtsPath, content);
      console.log(`    ${colorize.success('✓')} Updated index.d.ts imports`);
    }
  } catch (error) {
    console.error(`    ${colorize.error('[ERROR]')} Post-processing failed:`, error.message);
    throw error;
  }
}

async function buildWithNgPackagr(name, config, packageDir) {
  console.log(`  ${colorize.accent('◆')} Using ng-packagr for Ivy compatibility...`);

  const entryFile = config.entry || findEntryFile(`src/integrations/${name}`, ['.ts']);
  if (!entryFile) {
    throw new Error(`No entry file found for Angular package ${name}`);
  }

  const publicApiContent = `export * from './${path.relative(process.cwd(), entryFile).replace(/\\/g, '/').replace('.ts', '')}';`;
  fs.writeFileSync('public-api.ts', publicApiContent);

  const ngPackageConfig = {
    $schema: './node_modules/ng-packagr/ng-package.schema.json',
    dest: packageDir,
    lib: {
      entryFile: 'public-api.ts',
    },
  };

  fs.writeFileSync('ng-package.json', JSON.stringify(ngPackageConfig, null, 2));

  try {
    await runCommand(
      'npx',
      ['ng-packagr', '-p', 'ng-package.json', '-c', 'tsconfig.json'],
      process.cwd()
    );
    console.log(`  ${colorize.success('✓')} ng-packagr build complete with Ivy compatibility`);

    await postProcessAngularBuild(packageDir, name);
  } finally {
    ['ng-package.json', 'public-api.ts'].forEach((file) => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
  }
}

async function buildFrameworkPackage(name, config = {}) {
  const packageDir = path.join('packages', name);
  fs.mkdirSync(packageDir, { recursive: true });

  const displayName = name === 'vanilla' ? PROJECT_NAME : `@${PROJECT_NAME}/${name}`;
  console.log(`\n${colorize.box('BUILDING')} ${colorize.package(displayName)}`);

  let entryFile = config.entry;

  if (!entryFile) {
    const basePath = `src/integrations/${name}`;
    const extensions = config.jsx === true ? ['.tsx', '.ts', '.jsx', '.js'] : ['.ts', '.js'];
    entryFile = findEntryFile(basePath, extensions);
    if (entryFile) {
      console.log(`  ${colorize.info('→')} Found entry: ${colorize.file(entryFile)}`);
    }
  }

  if (!entryFile || !fs.existsSync(entryFile)) {
    console.log(
      `  ${colorize.warning('[!]')} Skipping - no entry file found for ${colorize.package(name)}`
    );
    return;
  }

  if (config.format === 'angular') {
    await buildWithNgPackagr(name, config, packageDir);
  } else {
    const buildOptions = {
      ...buildConfig,
      entryPoints: [entryFile],
      external: config.dependencies ? Object.keys(config.dependencies) : [],
    };

    if (config.jsx === true) {
      buildOptions.loader = {
        '.js': 'jsx',
        '.jsx': 'jsx',
        '.ts': 'tsx',
        '.tsx': 'tsx',
      };
      buildOptions.jsx = 'automatic';
      console.log(`  ${colorize.accent('◆')} JSX enabled for this package`);
    }

    const esmOutfile = path.join(packageDir, 'index.esm.js');
    await esbuild.build({
      ...buildOptions,
      format: 'esm',
      outfile: esmOutfile,
    });
    console.log(`  ${colorize.success('✓')} ESM build complete`);

    const cjsOutfile = path.join(packageDir, 'index.cjs');
    await esbuild.build({
      ...buildOptions,
      format: 'cjs',
      outfile: cjsOutfile,
    });
    console.log(`  ${colorize.success('✓')} CJS build complete`);

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
        globalName: '__temp',
        minify: true,
        sourcemap: false,
        outfile: path.join(packageDir, `${PROJECT_NAME}.min.js`),
        footer: {
          js: `;!function(){var L=__temp.default||__temp;"undefined"!=typeof window&&(window.${globalName}=L),"undefined"!=typeof global&&(global.${globalName}=L)}();`,
        },
      });
      console.log(`  ${colorize.success('✓')} UMD minified build complete`);
    }

    if (config.plugins && Array.isArray(config.plugins)) {
      console.log(`  ${colorize.info('[PLUGINS]')} Copying plugins...`);
      for (const pluginName of config.plugins) {
        const pluginSourcePath = path.join('src', 'plugins', `${pluginName}.js`);
        const pluginDestPath = path.join(packageDir, `${pluginName}.js`);
        if (fs.existsSync(pluginSourcePath)) {
          fs.copyFileSync(pluginSourcePath, pluginDestPath);
          console.log(
            `    ${colorize.success('✓')} Copied plugin: ${colorize.file(`${pluginName}.js`)}`
          );
        } else {
          console.log(
            `    ${colorize.warning('⚠')} Plugin not found: ${colorize.file(pluginSourcePath)}`
          );
        }
      }
    }
  }

  if (config.format !== 'angular') {
    const typeFile =
      config.types || (name === 'vanilla' ? `src/${PROJECT_NAME}.d.ts` : `src/types/${name}.d.ts`);

    if (name !== 'vanilla' && fs.existsSync(`src/${PROJECT_NAME}.d.ts`)) {
      fs.copyFileSync(`src/${PROJECT_NAME}.d.ts`, path.join(packageDir, `${PROJECT_NAME}.d.ts`));
    }

    if (fs.existsSync(typeFile)) {
      let content = fs.readFileSync(typeFile, 'utf8');
      content = content.replace(`../${PROJECT_NAME}`, `./${PROJECT_NAME}`);
      fs.writeFileSync(path.join(packageDir, 'index.d.ts'), content);
      console.log(`  ${colorize.success('✓')} TypeScript definitions copied`);
    }
  }

  const packageJson = createSubPackageJson(name, config);
  fs.writeFileSync(path.join(packageDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  console.log(`  ${colorize.success('✓')} package.json created`);

  if (name === 'vanilla' && fs.existsSync('README.md')) {
    fs.copyFileSync('README.md', path.join(packageDir, 'README.md'));
    console.log(`  ${colorize.success('✓')} README.md copied from root`);
  } else {
    const readme = createPackageReadme(name);
    fs.writeFileSync(path.join(packageDir, 'README.md'), readme);
    console.log(`  ${colorize.success('✓')} README.md created`);
  }

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

  await setupDevDependencies();

  const builtPackages = [];

  const vanillaConfig = rootPackageJson.packages?.vanilla || {};
  await buildFrameworkPackage('vanilla', {
    entry: `src/${PROJECT_NAME}.js`,
    ...vanillaConfig,
  });
  builtPackages.push('vanilla');

  const packagesConfig = rootPackageJson.packages || {};

  for (const [frameworkName, config] of Object.entries(packagesConfig)) {
    if (frameworkName === 'vanilla') continue;
    await buildFrameworkPackage(frameworkName, config);
    builtPackages.push(frameworkName);
  }

  function replaceVersionInAllFiles(directory, version) {
    const files = fs.readdirSync(directory, { recursive: true, withFileTypes: true });
    let replacedCount = 0;
    const modifiedFiles = [];
    for (const file of files) {
      if (file.isFile()) {
        const filePath = file.path
          ? path.join(file.path, file.name)
          : path.join(directory, file.name);
        if (
          file.name.endsWith('.map') ||
          file.name.match(/\.(png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot)$/)
        ) {
          continue;
        }
        try {
          let content = fs.readFileSync(filePath, 'utf-8');
          const originalContent = content;
          content = content.replace(/{%%VERSION%%}/g, version);

          if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf-8');
            replacedCount++;
            modifiedFiles.push(path.relative('packages', filePath));
          }
        } catch {}
      }
    }
    return { count: replacedCount, files: modifiedFiles };
  }

  console.log(`\n${colorize.brightGreen('==================================================')}`);

  console.log(
    `\n${colorize.info('[VERSION]')} Replacing {%%VERSION%%} with ${colorize.accent(rootPackageJson.version)}...`
  );
  const versionReplace = replaceVersionInAllFiles('packages', rootPackageJson.version);
  if (versionReplace.count > 0) {
    console.log(
      `  ${colorize.success('[OK]')} Updated ${versionReplace.count} file(s) with version ${colorize.accent(rootPackageJson.version)}`
    );
  } else {
    console.log(`  ${colorize.dim('→')} No version placeholders found`);
  }

  console.log(`\n${colorize.success('[SUCCESS]')} All builds complete!`);
  console.log(
    `${colorize.header('[LOCATION]')} Packages ready in ${colorize.file('./packages')} directory`
  );
  console.log(`\n${colorize.accent('To publish all packages:')}`);
  console.log(`  ${colorize.command('npm run publish-all')}`);
  console.log(`\n${colorize.accent('To publish individually:')}`);
  console.log(`  ${colorize.command('cd packages/[framework] && npm publish --tag beta')}`);
  console.log(`${colorize.brightGreen('==================================================')}`);

  if (fs.existsSync('./scripts/postbuild.js')) {
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
        ['./scripts/postbuild.js', Buffer.from(jsonString).toString('hex')],
        process.cwd()
      );

      console.log(`${colorize.success('[OK]')} Postbuild script completed successfully`);
    } catch (error) {
      console.error(`${colorize.warning('[WARNING]')} Postbuild script error:`, error.message);
    }
  }
}

build().catch((error) => {
  console.error(`${colorize.error('[ERROR]')} Build failed:`, error);
  process.exit(1);
});
