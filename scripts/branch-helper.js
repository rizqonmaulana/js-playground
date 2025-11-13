#!/usr/bin/env node
import inquirer from 'inquirer';
import { execSync } from 'child_process';

const BRANCH_TYPES = [
  { name: 'feat   → new functionality', value: 'feat' },
  { name: 'fix    → bug fix', value: 'fix' },
  { name: 'chore  → maintenance / tooling', value: 'chore' },
  { name: 'docs   → documentation only', value: 'docs' },
  { name: 'test   → adding or refactoring tests', value: 'test' },
  { name: 'hotfix → urgent production fix', value: 'hotfix' }
];

const MODULES = [
  'auth',
  'transaction',
  'master_data',
  'user',
  'report',
  'common'
];

// 📡 Get remote branches
function getRemoteBranches() {
  try {
    const branches = execSync('git branch -r', { encoding: 'utf8' })
      .split('\n')
      .map(b => b.trim().replace('origin/', ''))
      .filter(b => b && !b.includes('HEAD'))
      .filter((v, i, arr) => arr.indexOf(v) === i);

    console.log(`📡 Found ${branches.length} remote branches`);
    return branches.length ? branches : ['main', 'develop'];
  } catch {
    console.error('❌ Could not fetch remote branches.');
    return ['main', 'develop'];
  }
}

// 💻 Get local branches
function getLocalBranches() {
  try {
    const branches = execSync('git branch --format="%(refname:short)"', { encoding: 'utf8' })
      .split('\n')
      .map(b => b.trim())
      .filter(b => b);
    console.log(`💻 Found ${branches.length} local branches`);
    return branches.length ? branches : ['main', 'develop'];
  } catch {
    console.error('❌ Could not fetch local branches.');
    return ['main', 'develop'];
  }
}

async function main() {
  console.log('\n🌿 Branch Helper - Create New Branch (module-first format)\n');

  // 🧭 Ask whether to use local or remote branches
  const { branchSource } = await inquirer.prompt([
    {
      type: 'list',
      name: 'branchSource',
      message: 'Get branches from:',
      choices: [
        { name: '💻 Local branches', value: 'local' },
        { name: '📡 Remote branches (origin/*)', value: 'remote' }
      ],
      default: 'local'
    }
  ]);

  const availableBranches =
    branchSource === 'remote' ? getRemoteBranches() : getLocalBranches();

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'source',
      message: 'Select the source branch:',
      choices: availableBranches
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
  console.log(`📦 Source branch: ${source}\n`);

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

  try {
    if (branchSource === 'remote') {
      // 🌍 Remote branch workflow
      execSync(`git fetch origin ${source}`, { stdio: 'inherit' });
      execSync(`git checkout -B ${source} origin/${source}`, { stdio: 'inherit' });
      execSync(`git pull`, { stdio: 'inherit' });
    } else {
      // 💻 Local branch workflow (no pull)
      execSync(`git checkout ${source}`, { stdio: 'inherit' });
    }

    // 🌱 Create new branch from current source
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
    console.log(`\n🌱 New branch '${branchName}' created from '${source}'`);
  } catch (error) {
    console.error('\n❌ Failed to create branch. Please check your repo status.');
  }
}

main();
