//import "./music.js";
import "dotenv/config";
import express from "express";
import { getRPSChoices } from "./rps.js";

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
  checkLeaderboard,
  getUsername
} from "./utils.js";
import { getShuffledOptions, getResult } from "./rps.js";
import { get_answer, validate_guess, write_JSON_object, load_board, already_played, game_won, clear_guesses } from "./wordler.js";
import { flipCoin } from "./cf.js";

//import { flipCoin } from "./cf.js";
import fs from "fs";
import e from "express";

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
        try {
          // Call cfCommand.execute with a fake interaction-like object
          // Since express/discord-interactions doesn’t give you a Discord.js Interaction,
          // we simulate the reply by capturing the string.
          const chosenSide = data.options?.find(opt => opt.name === "side")?.value;
          const wagerStr = data.options?.find(opt => opt.name === "wager")?.value;
          const guildId = req.body.guild_id;
          const userId = req.body.member.user.id;

          // Flip the coin
          const randomFlip = Math.random() < 0.5 ? "heads" : "tails";
          const result = randomFlip;

          let response = `🪙 The coin landed on **${result}**!`;

          let win = false;
          if (chosenSide === result) {
            win = true;
            response += `\n✅ You guessed correctly!`;
          } else {
            win = false;
            response += `\n❌ You guessed ${chosenSide}, but it landed on ${result}.`;
          }

          if (wagerStr) {
            // Get user points
            const userPoints = await checkLeaderboard(userId);

            const wager = wagerStr ? parseInt(wagerStr) : 0;

            // Check if wager is valid for user
            if (wager > userPoints) {
              response = `❌ You cannot wager ${wager} points. You currently have ${userPoints} points.`
            } else {
              if (win) {
                updateLeaderboard(guildId, userId, wager, 1)
                response += `\n💰 You doubled your wager of **${wager}** points!`;
              } else {
                updateLeaderboard(guildId, userId, -wager, 1)
                response += `\n💰 You lost **${wager}** points`;
              }
            }
          }

          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.IS_COMPONENTS_V2,
              components: [
                {
                  type: MessageComponentTypes.TEXT_DISPLAY,
                  content: response
                },
              ],
            },
          });
        } catch (err) {
          console.error("coinflip error", err);
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.IS_COMPONENTS_V2,
              components: [
                {
                  type: MessageComponentTypes.TEXT_DISPLAY,
                  content: "There was an error handling your coinflip request.",
                },
              ],
            },
          });
        }
      }


      // --- Wordle command ---
      if (name === "wordler") {
        const subcommand = req.body.data.options?.[0]?.name;
        const context = req.body.context;
        const userId =
          context === 0 ? req.body.member.user.id : req.body.user.id;
        write_JSON_object(userId);

        if (subcommand === "guess") {
          // Save the Guess & Confirm if it's a valid guess.
          const guess = req.body.data.options[0].options[0].value.toLowerCase();
          let response_string = "";
          let response_template = "";
          if (!already_played(userId)) {
            const answer = get_answer(userId);

            if (guess.toLowerCase() === answer.toLowerCase()) {
              response_template += `${response_string}
            ✅ Correct! The word was "${answer}".`;
            } else {
              response_template += `${response_string}
<@${userId}>'s guess: ❌ "${guess}" is not the word of the day. Try again!`;
            }
            if (!validate_guess(guess, userId)) {
              response_template = "Wrong Guess Format, try again!";
            }
          } else {
            clear_guesses(userId);
            let won_string = "";
            if (game_won(userId)) {
              won_string += "won!";
            } else {
              won_string += "lost!";
            }
            response_template += `<@${userId}>: You've already completed the Wordle Today.
You ${won_string} 
Play again tommorow.`
          }

          load_board(userId);
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: response_template }
          });
        }

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: "null",
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

      // --- Rock Paper Scissors command ---
      if (name === "rps") {
        const guildId = req.body.guild_id;
        const userId = req.body.member.user.id;

        const options = req.body.data.options;
        const userChoice = options.find(opt => opt.name === "object")?.value;
        const wagerStr = options.find(opt => opt.name === "wager")?.value || 0;
        const wager = parseInt(wagerStr);

        // Bot picks randomly from rps.js choices
        const choices = getRPSChoices();
        const botChoice = choices[Math.floor(Math.random() * choices.length)];

        // Build player objects for getResult
        const player = { id: userId, objectName: userChoice, wager };
        const bot = { id: "BOT", objectName: botChoice };

        // Get result string (includes payout message)
        const resultMessage = getResult(player, bot);

        // Update leaderboard based on outcome
        if (wager > 0) {
          const userPoints = await checkLeaderboard(userId);

          if (wager > userPoints) {
            // Not enough points
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: { content: `❌ You cannot wager ${wager} points. You currently have ${userPoints} points.` },
            });
          }

          // Decide outcome by checking resultMessage
          if (resultMessage.includes("wins and earns")) {
            updateLeaderboard(guildId, userId, wager, 1); // add wager
          } else if (resultMessage.includes("loses and gets 0")) {
            updateLeaderboard(guildId, userId, -wager, 1); // subtract wager
          } else if (resultMessage.includes("tie")) {
            updateLeaderboard(guildId, userId, 0, 1); // tie, no points change but increment games played
          }
        }

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: resultMessage },
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
                content: await getLeaderboard("points", 5),
              },
            ],
          },
        });
      }

      // --- Update leaderboard command ---
      if (name === "update_leaderboard") {
        const params = req.body.data.options;
        let guildId = req.body.guild_id;
        let userId = req.body.member.user.id;
        let pointsToAdd = null;
        let gamesPlayedToAdd = null;

        for (let param of params) {
          /* if (param.name === "user") /userId = param.value;
          else */ if (param.name === "points") pointsToAdd = param.value;
          else if (param.name === "games") gamesPlayedToAdd = param.value;
        }

        if (gamesPlayedToAdd !== null) {
          updateLeaderboard(guildId, userId, pointsToAdd, gamesPlayedToAdd);
        } else {
          updateLeaderboard(guildId, userId, pointsToAdd);
        }

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: `Leaderboard updated for ${await getUsername(userId)}`,
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
