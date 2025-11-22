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

  async execute(interaction) {
    const chosenSide = interaction.options.getString("side");
    const wager = interaction.options.getString("wager");

    const randomFlip = Math.random() < 0.5 ? "heads" : "tails";
    const result = randomFlip;

    let response = `🪙 The coin landed on **${result}**!`;

    if (wager) {
      response += `\n💰 Wager: **${wager}**`;
    }

    if (chosenSide) {
      if (chosenSide === result) {
        response += `\n✅ You guessed correctly!`;
      } else {
        response += `\n❌ You guessed ${chosenSide}, but it landed on ${result}.`;
      }
    }

    await interaction.reply(response);

    await interaction.reply(response);
  },
};

