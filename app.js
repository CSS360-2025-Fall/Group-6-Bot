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
import { get_word_of_day } from "./newwordle.js";
import { flipCoin } from "./cf.js"; // <-- coin flip logic

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
      if (name === "wordler") {
        const subcommand = req.body.data.options?.[0]?.name;

        if (subcommand === "guess") {
          const guess = req.body.data.options[0].options[0].value;
          const answer = get_word_of_day();

          let response;
          if (guess.toLowerCase() === answer.toLowerCase()) {
            response = `✅ Correct! The word was "${answer}".`;
          } else {
            response = `❌ "${guess}" is not the word of the day. Try again!`;
          }

          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: response,
            },
          });
        }

        // Default behavior (show word of the day)
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: `The word today is "${get_word_of_day()}"`,
              },
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

