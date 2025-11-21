import "dotenv";
import { getRPSChoices } from "./rps.js";
import { capitalize, InstallGlobalCommands } from "./utils.js";
import { cfCommand } from "./cf.js";   // <-- your coinflip command object

import fs from "fs"; 

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
  name: "test",
  description: "Basic command",
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

// Command containing options
const CHALLENGE_COMMAND = {
  name: "rps",
  description: "Challenge to a match of rock paper scissors",
  options: [
    {
      type: 3,
      name: "object",
      description: "Pick your object",
      required: true,
      choices: createCommandChoices(),
    },
    {
      type: 10,
      name: "wager",
      description: "How much do you want to gamble?",
      required: false,
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 2],
};

const LEADERBOARD_COMMAND = {
  name: "leaderboard",
  description: "Displays leaderboard",
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const UPDATE_LEADERBOARD_COMMAND = {
  name: "update_leaderboard",
  description:
    "Test command for updating leaderboard without game",
  options: [
    {
      type: 3,
      name: "user",
      description: "User to update",
      required: true,
    },
    {
      type: 4,
      name: "points",
      description: "Points update amount",
      required: true,
    },
    {
      type: 4,
      name: "games",
      description: "Games played update amount",
      required: false,
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const WORDLE_COMMAND = {
  name: "wordler",
  description: "Play Wordler",
  type: 1,
  options: [
    {
      type: 1,
      name: "guess",
      description: "Guess Today's Word!",
      options: [
        {
          type: 3,
          name: "word",
          description: "Your guess",
          required: true,
        }
      ]
    }
  ],
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const HELP_COMMAND = {
  name: "help",
  description: "Show game rules, points, rewards, and commands",
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const INFO_COMMAND = {
  name: "info",
  description: "Displays information from README.md",
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const ALL_COMMANDS = [
  TEST_COMMAND,
  CHALLENGE_COMMAND,
  LEADERBOARD_COMMAND,
  UPDATE_LEADERBOARD_COMMAND,
  WORDLE_COMMAND,
  HELP_COMMAND,
  INFO_COMMAND,
  cfCommand.data.toJSON(),  
];

// Register globally
InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);

