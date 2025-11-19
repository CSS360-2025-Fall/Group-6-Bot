import "dotenv/config";
import express from "express";
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
  verifyKeyMiddleware,
} from "discord-interactions";
import {
  getRandomEmoji,
  DiscordRequest,
  getLeaderboard,
  updateLeaderboard,
} from "./utils.js";
import { getShuffledOptions, getResult } from "./rps.js";
import { startWordle } from "./wordle.js";
import { flipCoin } from "./cf.js"; 
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

// Store for in-progress games
const activeGames = {};

app.post(
  "/interactions",
  verifyKeyMiddleware(process.env.PUBLIC_KEY),
  async function (req, res) {
    const { type, id, data } = req.body;

    // PING check
    if (type === InteractionType.PING) {
      return res.send({ type: InteractionResponseType.PONG });
    }

    // Slash commands
    if (type === InteractionType.APPLICATION_COMMAND) {
      const { name } = data;

      // --- Coinflip command ---
      if (name === "coinflip") {
        const result = flipCoin();
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: `🪙 The coin landed on **${result}**!`,
              },
            ],
          },
        });
      }

      // --- Wordle command ---
      if (name === "dwordle") {
        const context = req.body.context;
        const userId =
          context === 0 ? req.body.member.user.id : req.body.user.id;

        let response;
        try {
          response = await startWordle(userId);
        } catch (e) {
          console.error("dwordle error", e);
          response = { content: "There was an error handling your request." };
        }

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              { type: MessageComponentTypes.TEXT_DISPLAY, content: response.content },
            ],
          },
        });
      }

      // --- Test command ---
      if (name === "test") {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: `hello world ${getRandomEmoji()}`,
              },
            ],
          },
        });
      }

      // --- Challenge command ---
      if (name === "challenge" && id) {
        const context = req.body.context;
        const userId =
          context === 0 ? req.body.member.user.id : req.body.user.id;
        const options = req.body.data.options;
        const objectName = options.find((opt) => opt.name === "object")?.value;
        const wager = options.find((opt) => opt.name === "wager")?.value || 0;

        activeGames[id] = { id: userId, objectName, wager };

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: `Rock paper scissors challenge from <@${userId}>`,
              },
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.BUTTON,
                    custom_id: `accept_button_${req.body.id}`,
                    label: "Accept",
                    style: ButtonStyleTypes.PRIMARY,
                  },
                ],
              },
            ],
          },
        });
      }

      // --- Leaderboard command ---
      if (name === "leaderboard") {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: getLeaderboard("points", 5),
              },
            ],
          },
        });
      }

      // --- Update leaderboard command ---
      if (name === "update_leaderboard") {
        const params = req.body.data.options || [];
        let userId = null;
        let pointsToAdd = null;
        let gamesPlayedToAdd = null;

        for (let param of params) {
          if (param.name === "user") userId = param.value;
          else if (param.name === "points") pointsToAdd = param.value;
          else if (param.name === "games") gamesPlayedToAdd = param.value;
        }

        if (!userId || !pointsToAdd) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.IS_COMPONENTS_V2,
              components: [
                {
                  type: MessageComponentTypes.TEXT_DISPLAY,
                  content: "Error: Please specify user and points",
                },
              ],
            },
          });
        }

        if (gamesPlayedToAdd !== null) {
          updateLeaderboard(userId, pointsToAdd, gamesPlayedToAdd);
        } else {
          updateLeaderboard(userId, pointsToAdd);
        }

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: `Leaderboard updated for ${userId}`,
              },
            ],
          },
        });
      }
     // --- Info command ---
if (name === "info") {
  try {
    const readmeContent = fs.readFileSync("./README.md", "utf8");

    // Discord messages have a 2000 character limit
    const message =
      readmeContent.length > 2000
        ? readmeContent.substring(0, 2000)
        : readmeContent;

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        flags: InteractionResponseFlags.IS_COMPONENTS_V2,
        components: [
          {
            type: MessageComponentTypes.TEXT_DISPLAY,
            content: message,
          },
        ],
      },
    });
  } catch (err) {
    console.error(err);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        flags: InteractionResponseFlags.IS_COMPONENTS_V2,
        components: [
          {
            type: MessageComponentTypes.TEXT_DISPLAY,
            content: "Could not read README.md file.",
          },
        ],
      },
    });
  }
}


      // --- Help command ---
      if (name === "help") {
        const banner =
          "🎮 Game Rules & Point System\n\nPlay games to earn points and compete with friends!";
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              { type: MessageComponentTypes.TEXT_DISPLAY, content: banner },
            ],
          },
        });
      }

      console.error(`unknown command: ${name}`);
      return res.status(400).json({ error: "unknown command" });
    }

    console.error("unknown interaction type", type);
    return res.status(400).json({ error: "unknown interaction type" });
  },
);

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});

