
// Command: !play <song name or YouTube link> 
import { DisTube } from "distube";
import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Initialize DisTube for music functionality
const distube = new DisTube(client, {
  emitNewSongOnly: true,
  //leaveOnEmpty: true,
  //youtubeDL: false, // No need for YouTube-dl
  plugins: [],
});

// --- Example command handler ---
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith("!")) return;

  const args = message.content.slice(1).trim().split(/ +/g);
  const cmd = args.shift().toLowerCase();

  // Join and play from YouTube
  if (cmd === "play") {
    if (!args.length)
      return message.channel.send("Please provide a song name or URL!");
    distube.play(message.member.voice.channel, args.join(" "), {
      textChannel: message.channel,
      member: message.member,
    });
  }

  // Skip
  if (cmd === "skip") distube.skip(message);
  if (cmd === "stop") distube.stop(message);
  if (cmd === "pause") distube.pause(message);
  if (cmd === "resume") distube.resume(message);
  if (cmd === "queue") {
    const queue = distube.getQueue(message);
    if (!queue) return message.channel.send("❌ | No queue!");
    message.channel.send(
      "🎶 Queue: " +
        queue.songs.map((song, i) => `${i + 1}. ${song.name}`).join("\n"),
    );
  }
});

// Handle DisTube events for feedback
distube.on("playSong", (queue, song) =>
  queue.textChannel.send(`▶ Playing: **${song.name}**`),
);
distube.on("addSong", (queue, song) =>
  queue.textChannel.send(`➕ Added: **${song.name}**`),
);
distube.on("error", (channel, error) => {
  channel.send(`❌ Error: ${error.message}`);
});

client.login(process.env.DISCORD_TOKEN);
