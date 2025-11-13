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

function getBranches() {
  try {
    const branches = execSync('git branch -r', { encoding: 'utf8' })
      .split('\n')
      .map(b => b.trim().replace('origin/', ''))
      .filter(b => b && !b.includes('HEAD'))
      .filter((v, i, arr) => arr.indexOf(v) === i);
    return branches;
  } catch {
    console.error('❌ Could not fetch branches.');
    return ['main', 'develop'];
  }
}

async function main() {
  console.log('\n🌿 Branch Helper - Create New Branch (module-first format)\n');

  const remoteBranches = getBranches();

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'source',
      message: 'Select the source branch:',
      choices: remoteBranches
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

  if (confirm) {
    try {
      execSync(`git fetch origin ${source}`, { stdio: 'inherit' });
      execSync(`git checkout ${source}`, { stdio: 'inherit' });
      execSync(`git pull`, { stdio: 'inherit' });
      execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
      console.log(`\n🌱 New branch '${branchName}' created from '${source}'`);
    } catch (error) {
      console.error('\n❌ Failed to create branch. Please check your repo status.');
    }
  } else {
    console.log('❎ Branch creation canceled.');
  }
}

main();
