#!/usr/bin/env node
/* eslint-disable sonarjs/no-os-command-from-path */
/* eslint-disable sonarjs/os-command */

import { execSync } from 'child_process';
import fs from 'fs';

import { hLog, colorLog } from './colorize.js';

// Global dry run flag
let isDryRun = false;

// Parse changelog to get the latest version entry
function parseChangelog() {
  const changelogPath = 'CHANGELOG.md';

  if (!fs.existsSync(changelogPath)) {
    throw new Error('CHANGELOG.md not found in project root');
  }

  const changelog = fs.readFileSync(changelogPath, 'utf-8');

  // Match version entries like ## [1.2.3] - 2025-09-16
  const versionRegex = /^## \[([^\]]+)\] - (\d{4}-\d{2}-\d{2})$/gm;
  const matches = [...changelog.matchAll(versionRegex)];

  if (matches.length === 0) {
    throw new Error('No version entries found in CHANGELOG.md');
  }

  // Get the first (latest) version
  const [fullMatch, version, date] = matches[0];
  const startIndex = changelog.indexOf(fullMatch);

  // Find where this version's content ends (next version or end of file)
  let endIndex;
  if (matches[1]) {
    endIndex = changelog.indexOf(matches[1][0]);
  } else {
    // Check for link references at the bottom
    const linkSectionRegex = /^\[[^\]]+\]:/m;
    const linkMatch = changelog.match(linkSectionRegex);
    endIndex = linkMatch ? changelog.lastIndexOf(linkMatch[0]) : changelog.length;
  }

  // Extract the content for this version
  const content = changelog.substring(startIndex + fullMatch.length, endIndex).trim();

  if (!content) {
    throw new Error(`No changelog content found for version ${version}`);
  }

  return {
    version,
    date,
    content,
    fullEntry: `## [${version}] - ${date}\n\n${content}`,
  };
}

// Check if a GitHub release already exists
async function releaseExists(tagName) {
  try {
    execSync(`gh release view ${tagName}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// Check if GitHub CLI is installed and authenticated
function checkGitHubCLI() {
  try {
    execSync('gh --version', { stdio: 'pipe' });
  } catch {
    throw new Error('GitHub CLI (gh) is not installed. Install from: https://cli.github.com/');
  }

  try {
    execSync('gh auth status', { stdio: 'pipe' });
  } catch {
    throw new Error('GitHub CLI is not authenticated. Run: gh auth login');
  }
}

// Create GitHub release
async function createGitHubRelease(version, releaseNotes, isDraft = false) {
  const tagName = `v${version}`;

  if (isDryRun) {
    hLog(2, false, 'brightBlack', '→', `Would create GitHub release /#tag ${tagName} #/`);
    console.log('');
    hLog(2, false, 'brightBlack', 'Release notes preview:');
    console.log('----------------------------------------');
    console.log(releaseNotes);
    console.log('----------------------------------------');
    return true;
  }

  try {
    const draftFlag = isDraft ? '--draft' : '';
    const prereleaseFlag = version.includes('-') ? '--prerelease' : '';

    // Create release with notes from stdin to handle multiline content
    const command = `gh release create ${tagName} ${draftFlag} ${prereleaseFlag} --title "${tagName}" --notes-file -`;

    execSync(command, {
      input: releaseNotes,
      stdio: ['pipe', 'inherit', 'inherit'],
    });

    return true;
  } catch (error) {
    throw new Error(`Failed to create GitHub release: ${error.message}`);
  }
}

async function main() {
  // Parse flags
  const helpFlag = process.argv.includes('--help') || process.argv.includes('-h');
  const draftFlag = process.argv.includes('--draft');
  const forceFlag = process.argv.includes('--force') || process.argv.includes('-f');
  const skipChangelogFlag = process.argv.includes('--skip-changelog');
  isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');

  // Custom version override
  const versionIndex = process.argv.findIndex((arg) => arg === '--version' || arg === '-v');
  const customVersion = versionIndex !== -1 ? process.argv[versionIndex + 1] : null;

  if (helpFlag) {
    colorLog(`
/#highlight GitHub Release Creator #/

/#info Description: #/
Creates GitHub releases from CHANGELOG.md entries. Requires changelog entry
for the current version unless explicitly skipped.

/#info Usage: #/ npm run create-release [options]

/#info Options: #/
  --dry-run, -d        Preview without creating release
  --draft              Create as draft release
  --force, -f          Overwrite existing release
  --skip-changelog     Skip changelog requirement (not recommended)
  --version, -v        Use specific version instead of package.json
  --help, -h           Show this help message

/#info Requirements: #/
  • GitHub CLI (gh) installed and authenticated
  • CHANGELOG.md with proper format
  • Git tag for the version (created by promote-to-stable)

/#info Changelog Format: #/
  ## [1.2.3] - 2025-09-16
  
  ### Added
  - New features...
  
  ### Fixed
  - Bug fixes...

/#info Examples: #/
  npm run create-release                    # Create release from changelog
  npm run create-release -- --dry-run       # Preview release
  npm run create-release -- --draft         # Create draft release
  npm run create-release -- --version 1.2.3 # Specific version
`);
    process.exit(0);
  }

  hLog(0, false, 'header', '==================================================', '', '\n');
  if (isDryRun) {
    hLog(0, true, 'brightBlack', 'dry run', 'No release will be created');
    console.log('');
  }
  hLog(0, false, 'highlight', 'GITHUB RELEASE CREATOR');
  hLog(0, false, 'header', '==================================================\n');

  try {
    // Check GitHub CLI
    checkGitHubCLI();
    hLog(0, false, 'success', '✓', 'GitHub CLI authenticated');

    // Get version from package.json or custom flag
    let version, changelogEntry;

    if (customVersion) {
      version = customVersion.replace(/^v/, ''); // Remove v prefix if present
      hLog(0, false, 'info', 'Version:', `/#version ${version} #/ (custom)`);

      if (!skipChangelogFlag) {
        // Try to find this version in changelog
        try {
          const changelog = parseChangelog();
          if (changelog.version === version) {
            changelogEntry = changelog;
          } else {
            throw new Error(`Version ${version} not found in CHANGELOG.md`);
          }
        } catch (error) {
          hLog(0, true, 'error', 'error', error.message);
          hLog(2, false, 'dim', '', 'Use --skip-changelog to skip this check');
          process.exit(1);
        }
      }
    } else {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      version = packageJson.version;
      hLog(0, false, 'info', 'Version:', `/#version ${version} #/`);

      if (!skipChangelogFlag) {
        // Parse changelog
        try {
          changelogEntry = parseChangelog();

          // Verify changelog version matches package.json
          if (changelogEntry.version !== version) {
            hLog(0, true, 'error', 'error', `Version mismatch!`);
            hLog(2, false, 'info', 'Package.json:', `/#version ${version} #/`);
            hLog(2, false, 'info', 'Changelog:', `/#version ${changelogEntry.version} #/`);
            console.log('');
            hLog(
              0,
              true,
              'info',
              'tip',
              'Update CHANGELOG.md with current version before releasing'
            );
            hLog(
              2,
              false,
              'dim',
              '',
              'Or use --skip-changelog to skip this check (not recommended)'
            );
            process.exit(1);
          }
        } catch (error) {
          hLog(0, true, 'error', 'error', error.message);
          console.log('');
          hLog(
            0,
            true,
            'info',
            'tip',
            'Add an entry for version /#version ' + version + ' #/ to CHANGELOG.md'
          );
          hLog(
            2,
            false,
            'dim',
            '',
            'Format: ## [' + version + '] - ' + new Date().toISOString().split('T')[0]
          );
          process.exit(1);
        }
      }
    }

    // Check if tag exists
    const tagName = `v${version}`;
    try {
      execSync(`git rev-parse ${tagName}`, { stdio: 'pipe' });
      hLog(0, false, 'success', '✓', `Git tag /#tag ${tagName} #/ exists`);
    } catch {
      hLog(0, true, 'error', 'error', `Git tag /#tag ${tagName} #/ not found`);
      hLog(
        2,
        false,
        'info',
        '',
        'Run /#command npm run promote-to-stable #/ first to create the tag'
      );
      if (!isDryRun) process.exit(1);
    }

    // Check if release already exists
    if (await releaseExists(tagName)) {
      if (!forceFlag) {
        hLog(0, true, 'warning', 'exists', `GitHub release /#tag ${tagName} #/ already exists`);
        hLog(2, false, 'dim', '', 'Use --force to recreate the release');
        process.exit(1);
      } else {
        hLog(0, true, 'warning', 'warning', `Deleting existing release /#tag ${tagName} #/...`);
        if (!isDryRun) {
          execSync(`gh release delete ${tagName} --yes`, { stdio: 'inherit' });
        }
      }
    }

    // Prepare release notes
    let releaseNotes = '';
    if (changelogEntry) {
      releaseNotes = changelogEntry.content;
      hLog(0, false, 'success', '✓', `Changelog entry found for /#version ${version} #/`);
    } else if (skipChangelogFlag) {
      // Generate minimal release notes
      releaseNotes = `Release ${version}\n\nNo changelog entry provided.`;
      hLog(0, true, 'warning', 'warning', 'Creating release without changelog entry');
    }

    // Show what we're about to do
    console.log('');
    hLog(0, true, 'header', 'creating release');

    if (draftFlag) {
      hLog(2, false, 'info', 'Mode:', 'Draft release');
    }
    if (version.includes('-')) {
      hLog(2, false, 'info', 'Type:', 'Pre-release');
    } else {
      hLog(2, false, 'info', 'Type:', 'Stable release');
    }

    // Create the release
    console.log('');
    await createGitHubRelease(version, releaseNotes, draftFlag);

    if (!isDryRun) {
      hLog(0, true, 'success', 'success', `GitHub release /#tag ${tagName} #/ created!`);
      console.log('');
      hLog(0, false, 'dim', 'View at:', `/#command gh release view ${tagName} --web #/`);
    } else {
      console.log('');
      hLog(0, true, 'brightBlack', 'dry run complete', 'No release was created');
    }

    // Show helpful commands
    console.log('');
    hLog(0, true, 'info', 'helpful commands', '', '\n');
    hLog(2, false, 'dim', 'View release:', `/#command gh release view ${tagName} #/`);
    hLog(2, false, 'dim', 'Open in browser:', `/#command gh release view ${tagName} --web #/`);
    hLog(2, false, 'dim', 'List all releases:', `/#command gh release list #/`);
    if (draftFlag && !isDryRun) {
      hLog(
        2,
        false,
        'dim',
        'Publish draft:',
        `/#command gh release edit ${tagName} --draft=false #/`
      );
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
