import { SlashCommandBuilder } from "discord.js";

export const cfCommand = {
  data: new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("Flip a coin, optionally choose side and wager")
    .addStringOption(option =>
      option.setName("side")
        .setDescription("Choose heads or tails (optional)")
        .setRequired(true)
        .addChoices(
          { name: "Heads", value: "heads" },
          { name: "Tails", value: "tails" }
        )
    )
    .addStringOption(option =>
      option.setName("wager")
        .setDescription("Enter your wager (optional)")
    ),
}

export async function flipCoin(chosenSide, wagerStr, userId) {
  // Flip the coin
  const randomFlip = Math.random() < 0.5 ? "heads" : "tails";
  const result = randomFlip;

  let response = `🪙 The coin landed on **${result}**!`;

  if (wager) {
    // Get user points
    const userPoints = await checkLeaderboard(userId);

    const wager = wagerStr ? parseInt(wagerStr) : 0;

    // Check if wager is valid for user
    if (wager > userPoints) {
      return await interaction.reply(
        `❌ You cannot wager ${wager} points. You currently have ${userPoints} points.`
      )
    }

    response += `\n💰 Wager: **${wager}**`;
  }

  if (chosenSide === result) {
    response += `\n✅ You guessed correctly!`;
  } else {
    response += `\n❌ You guessed ${chosenSide}, but it landed on ${result}.`;
  }

  await interaction.reply(response);
}