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

// Check for uncommitted changes
function hasUncommittedChanges() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    return status.trim().length > 0;
  } catch {
    return false;
  }
}

// Commit all changes
function commitChanges(version) {
  if (isDryRun) {
    hLog(2, false, 'brightBlack', '→', `Would commit all changes for v${version}`);
    return;
  }

  try {
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "chore: release v${version}"`, { stdio: 'inherit' });
    hLog(0, false, 'success', '✓', 'Changes committed');
  } catch (error) {
    throw new Error(`Failed to commit changes: ${error.message}`);
  }
}

// Create and push tag
function createTag(version) {
  const tagName = `v${version}`;

  if (isDryRun) {
    hLog(2, false, 'brightBlack', '→', `Would create and push tag ${tagName}`);
    return;
  }

  try {
    // Check if tag already exists locally
    try {
      execSync(`git rev-parse ${tagName}`, { stdio: 'pipe' });
      hLog(0, false, 'info', 'ℹ', `Tag ${tagName} already exists locally`);
    } catch {
      // Tag doesn't exist, create it
      execSync(`git tag -a ${tagName} -m "Release ${tagName}"`, { stdio: 'inherit' });
      hLog(0, false, 'success', '✓', `Tag ${tagName} created`);
    }

    // Push the tag
    execSync(`git push origin ${tagName}`, { stdio: 'inherit' });
    hLog(0, false, 'success', '✓', `Tag ${tagName} pushed to origin`);
  } catch (error) {
    throw new Error(`Failed to create/push tag: ${error.message}`);
  }
}

// Push commits to origin
function pushCommits() {
  if (isDryRun) {
    hLog(2, false, 'brightBlack', '→', 'Would push commits to origin');
    return;
  }

  try {
    execSync('git push origin main', { stdio: 'inherit' });
    hLog(0, false, 'success', '✓', 'Commits pushed to origin');
  } catch (error) {
    // Non-fatal, release can still be created
    hLog(0, true, 'warning', 'warning', `Failed to push commits: ${error.message}`);
  }
}

// Create GitHub release
async function createGitHubRelease(version, releaseNotes, isDraft = false) {
  const tagName = `v${version}`;

  if (isDryRun) {
    hLog(2, false, 'brightBlack', '→', `Would create GitHub release ${tagName}`);
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
  const skipCommitFlag = process.argv.includes('--skip-commit');
  const skipTagFlag = process.argv.includes('--skip-tag');
  const skipChangelogFlag = process.argv.includes('--skip-changelog');
  isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');

  // Custom version override
  const versionIndex = process.argv.findIndex((arg) => arg === '--version' || arg === '-v');
  const customVersion = versionIndex !== -1 ? process.argv[versionIndex + 1] : null;

  if (helpFlag) {
    colorLog(`
/#highlight GitHub Release Creator #/

/#info Description: #/
Complete release workflow: commits changes, creates tag, and publishes GitHub release.

/#info Usage: #/ npm run release:github [options]

/#info Options: #/
  --dry-run, -d        Preview all actions without executing
  --draft              Create as draft release
  --force, -f          Overwrite existing release
  --skip-commit        Skip git commit step
  --skip-tag           Skip tag creation step
  --skip-changelog     Skip changelog requirement
  --version, -v        Use specific version instead of package.json
  --help, -h           Show this help message

/#info Workflow: #/
  1. Commit all changes (if any)
  2. Create and push git tag
  3. Create GitHub release from changelog

/#info Requirements: #/
  • GitHub CLI (gh) installed and authenticated
  • CHANGELOG.md with proper format
  • Clean or committable working directory

/#info Examples: #/
  npm run release:github                    # Full release workflow
  npm run release:github -- --dry-run       # Preview all actions
  npm run release:github -- --draft         # Create draft release
  npm run release:github -- --skip-commit   # Already committed
`);
    process.exit(0);
  }

  hLog(0, false, 'header', '==================================================', '', '\n');
  if (isDryRun) {
    hLog(0, true, 'brightBlack', 'DRY RUN', 'No changes will be made');
    console.log('');
  }
  hLog(0, false, 'highlight', 'GITHUB RELEASE WORKFLOW');
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
    } else {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      version = packageJson.version;
      hLog(0, false, 'info', 'Version:', `/#version ${version} #/`);
    }

    // Parse changelog if not skipped
    if (!skipChangelogFlag) {
      try {
        changelogEntry = parseChangelog();

        // Verify changelog version matches
        if (changelogEntry.version !== version) {
          hLog(0, true, 'error', 'ERROR', `Version mismatch!`);
          hLog(2, false, 'info', 'Package.json:', `/#version ${version} #/`);
          hLog(2, false, 'info', 'Changelog:', `/#version ${changelogEntry.version} #/`);
          console.log('');
          hLog(0, true, 'info', 'TIP', 'Update CHANGELOG.md with current version before releasing');
          process.exit(1);
        }
        hLog(0, false, 'success', '✓', `Changelog entry found for ${version}`);
      } catch (error) {
        hLog(0, true, 'error', 'ERROR', error.message);
        console.log('');
        hLog(0, true, 'info', 'TIP', `Add an entry for version ${version} to CHANGELOG.md`);
        process.exit(1);
      }
    }

    // Step 1: Commit changes if needed and not skipped
    if (!skipCommitFlag) {
      if (hasUncommittedChanges()) {
        console.log('');
        hLog(0, true, 'header', 'STEP 1: Committing changes');
        commitChanges(version);
      } else {
        hLog(0, false, 'info', 'ℹ', 'No uncommitted changes');
      }
    }

    // Step 2: Create and push tag if not skipped
    if (!skipTagFlag) {
      console.log('');
      hLog(0, true, 'header', 'STEP 2: Creating tag');
      createTag(version);

      // Also push commits if we have any
      if (!skipCommitFlag) {
        pushCommits();
      }
    }

    const tagName = `v${version}`;

    // Step 3: Check if release already exists
    if (await releaseExists(tagName)) {
      if (!forceFlag) {
        hLog(0, true, 'warning', 'EXISTS', `GitHub release ${tagName} already exists`);
        hLog(2, false, 'dim', '', 'Use --force to recreate the release');
        process.exit(1);
      } else {
        hLog(0, true, 'warning', 'WARNING', `Deleting existing release ${tagName}...`);
        if (!isDryRun) {
          execSync(`gh release delete ${tagName} --yes`, { stdio: 'inherit' });
        }
      }
    }

    // Prepare release notes
    let releaseNotes = '';
    if (changelogEntry) {
      releaseNotes = changelogEntry.content;
    } else if (skipChangelogFlag) {
      releaseNotes = `Release ${version}\n\nNo changelog entry provided.`;
      hLog(0, true, 'warning', 'WARNING', 'Creating release without changelog entry');
    }

    // Step 4: Create the release
    console.log('');
    hLog(0, true, 'header', 'STEP 3: Creating GitHub release');

    if (draftFlag) {
      hLog(2, false, 'info', 'Mode:', 'Draft release');
    }
    if (version.includes('-')) {
      hLog(2, false, 'info', 'Type:', 'Pre-release');
    } else {
      hLog(2, false, 'info', 'Type:', 'Stable release');
    }

    console.log('');
    await createGitHubRelease(version, releaseNotes, draftFlag);

    if (!isDryRun) {
      console.log('');
      hLog(0, true, 'success', 'SUCCESS', `Complete release workflow finished for ${tagName}!`);
      console.log('');
      hLog(0, false, 'dim', 'View at:', `/#command gh release view ${tagName} --web #/`);
    } else {
      console.log('');
      hLog(0, true, 'brightBlack', 'DRY RUN COMPLETE', 'No actions were performed');
    }

    // Show helpful commands
    console.log('');
    hLog(0, true, 'info', 'HELPFUL COMMANDS', '', '\n');
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
    hLog(0, true, 'error', 'ERROR', error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  hLog(0, true, 'error', 'ERROR', `Script failed: ${error}`, '\n');
  process.exit(1);
});
