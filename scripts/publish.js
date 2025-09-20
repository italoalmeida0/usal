#!/usr/bin/env node
/* eslint-disable sonarjs/no-os-command-from-path */
/* eslint-disable sonarjs/os-command */

import { execSync } from 'child_process';
import fs from 'fs';

import { hLog, colorLog } from './colorize.js';

// Get latest latest version from npm
function getLatestLatestVersion(packageName) {
  try {
    const version = execSync(`npm view ${packageName} version`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();

    // Remove any prerelease suffix to get base latest version
    // eslint-disable-next-line sonarjs/slow-regex
    return version.replace(/-.*$/, '');
  } catch {
    // Package doesn't exist yet
    return '0.0.0';
  }
}

// Get next version by incrementing patch
function incrementVersion(version) {
  const parts = version.split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1; // Increment patch
  return parts.join('.');
}

// Get next prerelease version
function getNextPrereleaseVersion(packageName, baseVersion, prereleaseType) {
  try {
    // Get all versions from npm
    const versions = JSON.parse(
      execSync(`npm view ${packageName} versions --json`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      })
    );

    // Filter for this baseVersion and prereleaseType
    const prereleaseVersions = versions.filter((v) =>
      v.startsWith(`${baseVersion}-${prereleaseType}.`)
    );

    if (prereleaseVersions.length === 0) {
      return `${baseVersion}-${prereleaseType}.1`;
    }

    // Find highest number
    const numbers = prereleaseVersions.map((v) => {
      const match = v.match(new RegExp(`-${prereleaseType}\\.(\\d+)$`));
      return match ? parseInt(match[1]) : 0;
    });

    const nextNum = Math.max(...numbers) + 1;
    return `${baseVersion}-${prereleaseType}.${nextNum}`;
  } catch {
    // If can't fetch, start at 1
    return `${baseVersion}-${prereleaseType}.1`;
  }
}

async function main() {
  // Parse arguments
  const args = process.argv.slice(2);
  const helpFlag = args.includes('--help') || args.includes('-h');
  const dryRun = args.includes('--dry-run') || args.includes('-d');

  // Determine publish type
  let publishType = 'latest';

  if (args.includes('--canary')) {
    publishType = 'canary';
  } else if (args.includes('--beta')) {
    publishType = 'beta';
  } else if (args.includes('--alpha')) {
    publishType = 'alpha';
  }

  // Custom version override
  const versionIndex = args.findIndex((arg) => arg === '--version' || arg === '-v');
  const customVersion = versionIndex !== -1 ? args[versionIndex + 1] : null;

  // Custom tag override (overrides the default from publishType)
  const tagIndex = args.findIndex((arg) => arg === '--tag' || arg === '-t');
  if (tagIndex !== -1) {
    publishType = args[tagIndex + 1];
  }

  if (helpFlag) {
    colorLog(`
/#highlight PRE-PUBLISH VERSION MANAGER #/

/#info Description: #/
Automatically determines next version, updates monorepo package.json,
builds, and publishes. Version is based on latest npm version, not local.

/#info Usage: #/ npm run pre-publish [options]

/#info Options: #/
  --latest             Next latest version (auto-increment patch)
  --canary             Next canary version (latest+1-canary.X)
  --beta               Next beta version (latest+1-beta.X)
  --alpha              Next alpha version (latest+1-alpha.X)
  --version, -v        Use specific version
  --tag, -t            Use specific npm tag (overrides default)
  --dry-run, -d        Preview without changes
  --help, -h           Show this help message

/#info Version Logic: #/
  latest: Gets latest npm latest, increments patch
  Canary: Gets latest npm latest + 1, then canary.X
  Beta: Gets latest npm latest + 1, then beta.X
  Alpha: Gets latest npm latest + 1, then alpha.X

/#info Examples: #/
  npm run pre-publish --latest           # 1.2.3 → 1.2.4
  npm run pre-publish --canary           # 1.2.3 → 1.2.4-canary.1
  npm run pre-publish --beta             # 1.2.3 → 1.2.4-beta.1
  npm run pre-publish --version 2.0.0    # Force 2.0.0
  npm run pre-publish --version 2.0.0 --tag canary  # 2.0.0 with canary tag
  npm run pre-publish --version 1.9.9 --tag legacy  # 1.9.9 with legacy tag
`);
    process.exit(0);
  }

  hLog(0, false, 'header', '==================================================', '', '\n');
  if (dryRun) {
    hLog(0, true, 'brightBlack', 'dry run', 'No changes will be made');
    console.log('');
  }
  hLog(0, false, 'highlight', 'PRE-PUBLISH VERSION MANAGER');
  hLog(0, false, 'header', '==================================================\n');

  try {
    // Get package name from monorepo root
    const rootPackage = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const packageName = rootPackage.name.replace('-monorepo', '');

    hLog(0, false, 'info', 'Package:', `/#package ${packageName} #/`);
    hLog(0, false, 'info', 'Publish type:', `/#tag ${publishType} #/`);

    // Get latest latest version from npm
    const latestLatest = getLatestLatestVersion(packageName);
    hLog(0, false, 'info', 'Latest latest on npm:', `/#version ${latestLatest} #/`);

    // Determine new version
    let newVersion;

    if (customVersion) {
      // Use custom version as-is
      newVersion = customVersion;
      hLog(0, false, 'info', 'Custom version:', `/#version ${newVersion} #/`);
    } else if (publishType === 'latest') {
      // For latest: increment patch of latest npm latest
      newVersion = incrementVersion(latestLatest);
      hLog(0, false, 'info', 'Next latest version:', `/#version ${newVersion} #/`);
    } else {
      // For prereleases: latest+1, then find next prerelease number
      const nextLatest = incrementVersion(latestLatest);
      newVersion = getNextPrereleaseVersion(packageName, nextLatest, publishType);
      hLog(0, false, 'info', 'Next prerelease:', `/#version ${newVersion} #/`);
    }

    // Update root package.json
    console.log('');
    hLog(0, true, 'header', 'updating version');

    if (dryRun) {
      hLog(2, false, 'brightBlack', '→', `Would update package.json to /#version ${newVersion} #/`);
    } else {
      rootPackage.version = newVersion;
      fs.writeFileSync('package.json', JSON.stringify(rootPackage, null, 2) + '\n');
      hLog(2, false, 'success', '✓', `Updated package.json to /#version ${newVersion} #/`);
    }

    // Build (which auto-generates packages/)
    console.log('');
    hLog(0, true, 'header', 'building');

    if (!dryRun) {
      hLog(0, false, 'info', 'Running build...', '');
      execSync('npm run build', { stdio: 'inherit' });
      hLog(0, false, 'success', '✓', 'Build completed (packages/ generated)');
    } else {
      hLog(2, false, 'brightBlack', '→', 'Would run: /#command npm run build #/');
      hLog(2, false, 'brightBlack', '', '(this generates packages/ folder)');
    }

    // Publish
    console.log('');
    hLog(0, true, 'header', 'publishing');

    const publishCmd = `npm publish --workspaces --tag ${publishType} --access public`;

    if (!dryRun) {
      hLog(0, false, 'info', 'Publishing to npm...', '');
      hLog(2, false, 'dim', 'Command:', `/#command ${publishCmd} #/`);
      execSync(publishCmd, { stdio: 'inherit' });
      hLog(0, false, 'success', '✓', `Published as /#tag ${publishType} #/`);
    } else {
      hLog(2, false, 'brightBlack', '→', `Would run: /#command ${publishCmd} #/`);
    }

    // Summary
    console.log('');
    hLog(0, false, 'header', '==================================================', '', '\n');
    if (dryRun) {
      hLog(0, true, 'brightBlack', 'dry run summary');
      hLog(2, false, 'brightBlack', 'Would publish:', `/#version ${newVersion} #/`);
      hLog(2, false, 'brightBlack', 'NPM tag:', `/#tag ${publishType} #/`);
      hLog(2, false, 'brightBlack', 'Based on npm latest:', `/#version ${latestLatest} #/`);
    } else {
      hLog(
        0,
        true,
        'success',
        'success',
        `Published /#version ${newVersion} #/ as /#tag ${publishType} #/!`
      );
      console.log('');
      hLog(
        0,
        false,
        'dim',
        'Install with:',
        `/#command npm install ${packageName}@${publishType} #/`
      );
      hLog(
        0,
        false,
        'dim',
        'Or specific:',
        `/#command npm install ${packageName}@${newVersion} #/`
      );
    }

    // Next steps
    console.log('');
    hLog(0, true, 'info', 'next steps', '', '\n');

    if (publishType === 'latest' && !dryRun) {
      hLog(2, false, 'dim', '1. Update CHANGELOG.md with changes', '');
      hLog(2, false, 'dim', '2. Create GitHub release:', `/#command npm run release:github #/`);
    } else if (publishType !== 'latest') {
      hLog(2, false, 'dim', 'View all versions:', `/#command npm view ${packageName} versions #/`);
      hLog(2, false, 'dim', 'View dist-tags:', `/#command npm view ${packageName} dist-tags #/`);
    }
  } catch (error) {
    hLog(0, true, 'error', 'error', error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  hLog(0, true, 'error', 'error', `Script failed: ${error}`, '\n');
  process.exit(1);
});
