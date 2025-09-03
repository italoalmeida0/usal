#!/usr/bin/env node

import fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { colorize, colors } from './colorize.js';

// Helper function to run commands
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
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

function formatTags(jsonString) {
  try {
    const tags = JSON.parse(jsonString);
    const entries = Object.entries(tags);
    if (entries.length === 0) return 'No tags found';

    return entries
      .map(([tag, version]) => `${tag}: ${colors.brightMagenta}${version}${colors.reset}`)
      .join(', ');
  } catch {
    return jsonString; // Return original if not valid JSON
  }
}

// Get output from command
function getCommandOutput(command, args) {
  return new Promise((resolve, reject) => {
    let output = '';
    const proc = spawn(command, args, {
      shell: process.platform === 'win32',
    });

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

// Function to update version in HTML file
function updateHTMLVersion(version) {
  const htmlPath = 'index.html';

  if (fs.existsSync(htmlPath)) {
    try {
      let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

      // Pattern to match <div class="version">Version X.X.X</div>
      const versionPattern = /(<div class="version">Version\s+)[^<]+(<\/div>)/g;

      if (versionPattern.test(htmlContent)) {
        // Reset regex state
        versionPattern.lastIndex = 0;

        // Replace version
        htmlContent = htmlContent.replace(versionPattern, `$1${version}$2`);

        // Save updated HTML
        fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
        console.log(
          `${colorize.success('✓')} Updated ${colorize.file('index.html')} with version ${colorize.version(version)}`
        );
        return true;
      } else {
        console.log(
          `${colorize.warning('[!]')} Version div not found in ${colorize.file('index.html')}`
        );
        return false;
      }
    } catch (error) {
      console.error(`${colorize.error('[X]')} Failed to update HTML: ${error.message}`);
      return false;
    }
  } else {
    console.log(
      `${colorize.info('[i]')} ${colorize.file('index.html')} not found, skipping HTML update`
    );
    return false;
  }
}

async function updateTags() {
  console.log(`\n${colorize.header('==================================================')}`);
  console.log(`${colorize.highlight('NPM TAGS UPDATE')} - Updating all package tags`);
  console.log(`${colorize.header('==================================================')}\n`);

  // Read root package.json
  const rootPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const PROJECT_NAME = rootPackageJson.name.split('-monorepo')[0];
  const version = rootPackageJson.version;

  console.log(`${colorize.info('Project:')} ${colorize.package(PROJECT_NAME)}`);
  console.log(`${colorize.info('Version:')} ${colorize.version(version)}\n`);

  // Update HTML version first
  updateHTMLVersion(version);
  console.log('');

  // Determine which tag to use based on version
  let targetTag = 'latest';
  if (version.includes('-beta')) {
    console.log(
      `${colorize.warning('[BETA]')} Beta version detected. Setting as latest anyway...\n`
    );
  }

  // List of packages to update
  const packages = [];

  // Add main/vanilla package
  packages.push({
    name: PROJECT_NAME,
    version: version,
  });

  // Add framework packages from packages directory
  if (fs.existsSync('packages')) {
    const packageDirs = fs.readdirSync('packages');

    for (const dir of packageDirs) {
      if (dir === 'vanilla') continue; // Already added as main package

      const packageJsonPath = path.join('packages', dir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const pkgJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        packages.push({
          name: pkgJson.name,
          version: pkgJson.version,
        });
      }
    }
  }

  console.log(`${colorize.header('[PACKAGES]')} Packages to update:`);
  packages.forEach((pkg) =>
    console.log(
      `   ${colorize.bullet()} ${colorize.package(pkg.name)}@${colorize.version(pkg.version)}`
    )
  );
  console.log('');

  // Update tags for each package
  let successCount = 0;
  let failCount = 0;

  for (const pkg of packages) {
    try {
      console.log(`\n${colorize.info('[UPDATING]')} ${colorize.package(pkg.name)}...`);

      // First, check current tags
      try {
        const currentTags = await getCommandOutput('npm', [
          'view',
          pkg.name,
          'dist-tags',
          '--json',
        ]);
        console.log(`   ${colorize.dim('Current tags:')} ${formatTags(currentTags)}`);
      } catch (e) {
        console.log(`   ${colorize.dim('Could not fetch current tags')}`);
      }

      // Update the latest tag to point to the current version
      await runCommand('npm', ['dist-tag', 'add', `${pkg.name}@${pkg.version}`, 'latest']);

      console.log(
        `   ${colorize.success('✓')} Successfully set ${colorize.success(pkg.name)}@${colorize.header(pkg.version)} as ${colorize.tag('latest')}`
      );
      successCount++;

      // Verify the update
      try {
        const newTags = await getCommandOutput('npm', ['view', pkg.name, 'dist-tags', '--json']);
        console.log(`   ${colorize.dim('New tags:')} ${formatTags(newTags)}`);
      } catch (e) {
        // Ignore verification errors
      }
    } catch (error) {
      console.error(
        `   ${colorize.error('[X]')} Failed to update ${colorize.package(pkg.name)}: ${error.message}`
      );
      failCount++;
    }
  }

  // Summary
  console.log(`\n${colorize.header('==================================================')}`);
  console.log(`${colorize.highlight('[SUMMARY]')}`);
  console.log(
    `   ${colorize.success('✓ Successfully updated:')} ${colorize.success(successCount + ' packages')}`
  );
  if (failCount > 0) {
    console.log(`   ${colorize.error('✗ Failed:')} ${colorize.error(failCount + ' packages')}`);
  }
  console.log(`${colorize.header('==================================================')}`);

  if (successCount > 0) {
    console.log(
      `\n${colorize.success('[SUCCESS]')} Tags updated! Your packages are now showing the latest version on NPM.`
    );
    console.log(
      `   Users installing with ${colorize.command('"npm install"')} will now get version ${colorize.version(version)}`
    );
  }
}

// Run the script
updateTags().catch((error) => {
  console.error(`\n${colorize.error('[ERROR]')} Script failed:`, error);
  process.exit(1);
});
