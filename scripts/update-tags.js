#!/usr/bin/env node
/* eslint-disable sonarjs/os-command */
/* eslint-disable sonarjs/no-ignored-exceptions */

import { spawn, execSync } from 'child_process';
import fs from 'fs';
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

// Function to check if git tag exists
function gitTagExists(tagName) {
  try {
    execSync(`git rev-parse ${tagName}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Function to create and push Git tag
async function createGitTag(version, push = true) {
  const tagName = `v${version}`;

  try {
    // Check if tag already exists
    if (gitTagExists(tagName)) {
      console.log(`${colorize.warning('[!]')} Git tag ${colorize.tag(tagName)} already exists`);
      console.log(`   Would you like to delete and recreate it? (Use --force flag)`);
      return false;
    }

    // Create annotated tag
    console.log(`${colorize.info('[GIT]')} Creating tag ${colorize.tag(tagName)}...`);

    // Use execSync with escaped message
    const tagMessage = `Release ${version}`.replace(/"/g, '\\"');
    try {
      execSync(`git tag -a ${tagName} -m "${tagMessage}"`, { stdio: 'pipe' });
    } catch (error) {
      // Fallback: try with simple message
      execSync(`git tag -a ${tagName} -m "Release"`, { stdio: 'pipe' });
    }

    console.log(`   ${colorize.success('✓')} Created Git tag ${colorize.tag(tagName)}`);

    if (push) {
      // Push tag to origin
      console.log(`${colorize.info('[GIT]')} Pushing tag to origin...`);
      execSync(`git push origin ${tagName}`, { stdio: 'pipe' });
      console.log(`   ${colorize.success('✓')} Pushed tag ${colorize.tag(tagName)} to origin`);
    }

    return true;
  } catch (error) {
    console.error(`   ${colorize.error('[X]')} Failed to create/push Git tag: ${error.message}`);

    // Provide helpful error messages
    if (error.message.includes('not a git repository')) {
      console.log(`   ${colorize.info('[i]')} Make sure you're in a Git repository.`);
    } else if (error.message.includes('failed to push')) {
      console.log(`   ${colorize.info('[i]')} Check your remote repository permissions.`);
    }
    return false;
  }
}

// Function to handle forced tag update
async function forceUpdateGitTag(version) {
  const tagName = `v${version}`;

  try {
    // Delete local tag if it exists
    if (gitTagExists(tagName)) {
      execSync(`git tag -d ${tagName}`, { stdio: 'pipe' });
      console.log(`   ${colorize.info('→')} Deleted local tag ${colorize.tag(tagName)}`);
    }

    // Delete remote tag if it exists (ignore errors)
    try {
      execSync(`git push origin :refs/tags/${tagName}`, { stdio: 'pipe' });
      console.log(`   ${colorize.info('→')} Deleted remote tag ${colorize.tag(tagName)}`);
    } catch {
      // Remote tag might not exist, that's ok
    }

    // Create new tag
    const tagMessage = `Release ${version}`.replace(/"/g, '\\"');
    try {
      execSync(`git tag -a ${tagName} -m "${tagMessage}"`, { stdio: 'pipe' });
    } catch (error) {
      // Fallback: try with simple message
      execSync(`git tag -a ${tagName} -m "Release"`, { stdio: 'pipe' });
    }
    console.log(`   ${colorize.success('✓')} Created new Git tag ${colorize.tag(tagName)}`);

    // Push new tag
    execSync(`git push origin ${tagName}`, { stdio: 'pipe' });
    console.log(`   ${colorize.success('✓')} Pushed tag ${colorize.tag(tagName)} to origin`);

    return true;
  } catch (error) {
    console.error(`   ${colorize.error('[X]')} Failed to force update Git tag: ${error.message}`);
    return false;
  }
}

async function updateTags() {
  // Check for flags
  const forceFlag = process.argv.includes('--force') || process.argv.includes('-f');
  const noGitFlag = process.argv.includes('--no-git');
  const noPushFlag = process.argv.includes('--no-push');
  const helpFlag = process.argv.includes('--help') || process.argv.includes('-h');

  // Show help if requested
  if (helpFlag) {
    console.log(`
${colorize.highlight('NPM & Git Tags Updater')}

${colorize.info('Usage:')} npm run update-tags [options]

${colorize.info('Options:')}
  --force, -f     Force overwrite existing Git tags
  --no-git        Skip Git tag creation
  --no-push       Create Git tags locally only (don't push)
  --help, -h      Show this help message

${colorize.info('Examples:')}
  npm run update-tags                    # Update NPM tags and create Git tag
  npm run update-tags -- --force         # Force recreate existing tags
  npm run update-tags -- --no-git        # Only update NPM tags
  npm run update-tags -- --no-push       # Create local Git tag only
`);
    process.exit(0);
  }

  console.log(`\n${colorize.header('==================================================')}`);
  console.log(`${colorize.highlight('NPM & GIT TAGS UPDATE')} - Updating all package tags`);
  console.log(`${colorize.header('==================================================')}\n`);

  // Read root package.json
  const rootPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const PROJECT_NAME = rootPackageJson.name.split('-monorepo')[0];
  const version = rootPackageJson.version;

  console.log(`${colorize.info('Project:')} ${colorize.package(PROJECT_NAME)}`);
  console.log(`${colorize.info('Version:')} ${colorize.version(version)}`);

  // Show active flags
  if (forceFlag) {
    console.log(`${colorize.warning('[MODE]')} Force mode enabled - will overwrite existing tags`);
  }
  if (noGitFlag) {
    console.log(`${colorize.info('[MODE]')} Git tagging disabled`);
  }
  if (noPushFlag && !noGitFlag) {
    console.log(`${colorize.info('[MODE]')} Git push disabled - tags will be created locally only`);
  }
  console.log('');

  // Create Git tag before NPM updates
  let gitTagSuccess = false;
  if (!noGitFlag) {
    console.log(`${colorize.header('[GIT TAGGING]')}`);

    if (forceFlag) {
      gitTagSuccess = await forceUpdateGitTag(version);
    } else {
      gitTagSuccess = await createGitTag(version, !noPushFlag);
      if (!gitTagSuccess && gitTagExists(`v${version}`)) {
        console.log(`\n${colorize.info('[TIP]')} Use --force flag to overwrite existing tags`);
        console.log(`      Example: npm run update-tags -- --force\n`);
      }
    }
    console.log('');
  }

  // Determine which tag to use based on version
  if (version.includes('-beta')) {
    console.log(
      `${colorize.warning('[BETA]')} Beta version detected. Setting as latest anyway...\n`
    );
  } else if (version.includes('-alpha')) {
    console.log(
      `${colorize.warning('[ALPHA]')} Alpha version detected. Setting as latest anyway...\n`
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

  console.log(`${colorize.header('[NPM PACKAGES]')} Packages to update:`);
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
    `   ${colorize.success('✓ NPM packages updated:')} ${colorize.success(successCount + ' packages')}`
  );
  if (failCount > 0) {
    console.log(`   ${colorize.error('✗ Failed:')} ${colorize.error(failCount + ' packages')}`);
  }
  if (!noGitFlag) {
    const gitStatus = gitTagSuccess
      ? `${colorize.success('✓ Created successfully')}`
      : `${colorize.warning('⚠ Not created (see above)')}`;
    console.log(`   ${colorize.info('Git tag v' + version + ':')} ${gitStatus}`);
  }
  console.log(`${colorize.header('==================================================')}`);

  if (successCount > 0) {
    console.log(`\n${colorize.success('[SUCCESS]')} NPM tags updated!`);
    console.log(
      `   Users installing with ${colorize.command('npm install')} will now get version ${colorize.version(version)}`
    );

    if (!noGitFlag && gitTagSuccess) {
      console.log(
        `   Git tag ${colorize.tag(`v${version}`)} is ${noPushFlag ? 'available locally' : 'now available on origin'}`
      );
    }
  }

  // Show helpful commands
  console.log(`\n${colorize.info('[HELPFUL COMMANDS]')}`);
  console.log(`   View all Git tags:     ${colorize.command('git tag -l')}`);
  console.log(`   View remote tags:      ${colorize.command('git ls-remote --tags origin')}`);
  console.log(`   Checkout a tag:        ${colorize.command(`git checkout v${version}`)}`);
  console.log(`   Delete local tag:      ${colorize.command(`git tag -d v${version}`)}`);
  console.log(
    `   Delete remote tag:     ${colorize.command(`git push origin :refs/tags/v${version}`)}`
  );
}

// Run the script
updateTags().catch((error) => {
  console.error(`\n${colorize.error('[ERROR]')} Script failed:`, error);
  process.exit(1);
});
