import 'dotenv';
import { getRPSChoices } from './game.js';
import { capitalize, InstallGlobalCommands } from './utils.js';

// Get the game choices from game.js
function createCommandChoices() {
  const choices = getRPSChoices();
  const commandChoices = [];

  for (let choice of choices) {
    commandChoices.push({
      name: capitalize(choice),
      value: choice.toLowerCase(),
    });
  }

  return commandChoices;
}

// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

// Command containing options
const CHALLENGE_COMMAND = {
  name: 'challenge',
  description: 'Challenge to a match of rock paper scissors',
  options: [
    {
      type: 3,
      name: 'object',
      description: 'Pick your object',
      required: true,
      choices: createCommandChoices(),
    },
    {
      type: 10,
      name: 'wager',
      description: 'How much do you want to gamble?',
      required: false,
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 2],
};

// Command to display leaderboard
const LEADERBOARD_COMMAND = {
  name: 'leaderboard',
  description: 'Display leaderboard',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2]
};

const ALL_COMMANDS = [TEST_COMMAND, CHALLENGE_COMMAND, LEADERBOARD_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
