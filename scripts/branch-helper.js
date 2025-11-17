#!/usr/bin/env node

const { execSync } = require('child_process');

// Branch type options
const BRANCH_TYPES = [
  { name: 'feat   → new functionality', value: 'feat' },
  { name: 'fix    → bug fix', value: 'fix' },
  { name: 'chore  → maintenance / tooling', value: 'chore' },
  { name: 'docs   → documentation only', value: 'docs' },
  { name: 'test   → adding or refactoring tests', value: 'test' },
  { name: 'hotfix → urgent production fix', value: 'hotfix' }
];

// Module list
const MODULES = [
  'auth',
  'transaction',
  'master_data',
  'user',
  'report',
  'common'
];

// Generic branch getter
function getBranches(cmd, removeOriginPrefix = false) {
  try {
    return execSync(cmd, { encoding: 'utf8' })
      .split('\n')
      .map(b => {
        b = b.trim();
        if (removeOriginPrefix) b = b.replace('origin/', '');
        return b;
      })
      .filter(b => b && !b.includes('HEAD'))
      .filter((v, i, arr) => arr.indexOf(v) === i);
  } catch {
    console.error('❌ Could not fetch branches.');
    return ['main', 'develop'];
  }
}

async function main() {
  // Dynamic import for Inquirer (ESM-only)
  const inquirer = (await import('inquirer')).default;

  console.log('\n🌿 Branch Helper - Create New Branch (module-first format)\n');

  // Ask local or remote selection
  const { branchSourceType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'branchSourceType',
      message: 'Select where to pick the source branch from:',
      choices: [
        { name: 'Local branches', value: 'local' },
        { name: 'Remote branches', value: 'remote' }
      ]
    }
  ]);

  // Load branches based on choice
  let branches = [];
  if (branchSourceType === 'local') {
    branches = getBranches('git branch', false).map(b => b.replace('* ', ''));
  } else {
    branches = getBranches('git branch -r', true);
  }

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'source',
      message: `Select the ${branchSourceType} source branch:`,
      choices: branches
    },
    {
      type: 'list',
      name: 'type',
      message: 'Select branch type:',
      choices: BRANCH_TYPES
    },
    {
      type: 'list',
      name: 'module',
      message: 'Select the module:',
      choices: MODULES
    },
    {
      type: 'input',
      name: 'story',
      message: 'Enter the User Story number (e.g. 14):',
      validate: (input) => (input && !isNaN(input) ? true : 'Please enter a valid number')
    },
    {
      type: 'input',
      name: 'desc',
      message: 'Write a short branch description (e.g. add-login):',
      validate: (input) => (input ? true : 'Description cannot be empty')
    }
  ]);

  const { source, type, module, story, desc } = answers;

  const branchName = `${type}/${module}.US-${story}.${desc}`
    .toLowerCase()
    .replace(/\s+/g, '-');

  console.log('\n✅ Generated branch name:');
  console.log(`\n   ${branchName}\n`);
  console.log(`📦 Source branch: ${source} (${branchSourceType})\n`);

  // Confirmation
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Create and switch to this branch?',
      default: true
    }
  ]);

  if (!confirm) {
    console.log('❎ Branch creation canceled.');
    return;
  }

  // EXECUTE GIT COMMANDS
  try {
    if (branchSourceType === 'remote') {
      execSync(`git fetch origin ${source}`, { stdio: 'inherit' });
    }

    execSync(`git checkout ${source}`, { stdio: 'inherit' });
    execSync(`git pull`, { stdio: 'inherit' });
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });

    console.log(`\n🌱 New branch '${branchName}' created from '${source}'`);
  } catch (error) {
    console.error('\n❌ Failed to create branch. Please check your repo status.');
  }
}

main();
