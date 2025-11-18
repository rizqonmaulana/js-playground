#!/usr/bin/env node
const { execSync } = require('child_process');

async function getInquirer() {
  const mod = await import('inquirer');
  return mod.default || mod;
}

async function main() {
  const inquirer = await getInquirer();

  const MODULES = [
    'auth',
    'transaction',
    'master_data',
    'user',
    'report',
    'common'
  ];

  const TYPES = [
    { name: 'feat     → new feature', value: 'feat' },
    { name: 'fix      → bug fix', value: 'fix' },
    { name: 'docs     → documentation only', value: 'docs' },
    { name: 'refactor → refactor code', value: 'refactor' },
    { name: 'test     → adding or refactoring tests', value: 'test' },
    { name: 'chore    → maintenance / tooling', value: 'chore' },
    { name: 'hotfix   → urgent production fix', value: 'hotfix' },
  ];

  console.log('\n🚀 Commit Helper - Generate Conventional Commit with User Story ID\n');

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'Select the type of change:',
      choices: TYPES
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
      name: 'description',
      message: 'Write a short description of the change:',
      validate: (input) => (input ? true : 'Description cannot be empty')
    }
  ]);

  const { type, module, story, description } = answers;
  const commitMessage = `${type}(${module}): [US-${story}] ${description}`;

  console.log('\n✅ Generated commit message:');
  console.log(`\n   ${commitMessage}\n`);

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Proceed with commit?',
      default: true
    }
  ]);

  if (confirm) {
    try {
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    } catch (error) {
      console.error('\n❌ Git commit failed. Please check your staged changes.');
    }
  } else {
    console.log('❎ Commit canceled.');
  }
}

main();
