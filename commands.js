import "dotenv/config";
import { getRPSChoices } from "./rps.js";
import { capitalize, InstallGlobalCommands } from "./utils.js";
import { cfCommand } from "./cf.js";

import fs from "fs";


const PLAY_COMMAND = {
  name: "play",
  description: "Play music from YouTube",
  type: 1,
  options: [
    {
      type: 3,
      name: "song",
      description: "Song name or YouTube URL",
      required: true,
    },
  ],
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
  PLAY_COMMAND,
];


InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
