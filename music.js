console.log("🔧 MUSIC.JS STARTING...");

const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

console.log("🔧 Discord.js loaded");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const timeout = setTimeout(() => {
  console.log("❌ TIMEOUT: Discord login took too long");
  process.exit(1);
}, 30000);

client.once("ready", () => {
  clearTimeout(timeout);
  console.log("✅ MUSIC BOT READY! Logged in as: " + client.user.tag);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  
  if (message.content.startsWith("!play")) {
    const args = message.content.slice(5).trim();
    if (!args) return message.channel.send("❌ Please provide a song name!");
    
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.channel.send("❌ Join a voice channel first!");
    
    message.channel.send(`🎵 Command received: **${args}**\n✅ Basic music system working!`);
  }
});

console.log("🔧 Attempting login...");
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log("🔧 Login process started"))
  .catch(error => {
    clearTimeout(timeout);
    console.log("❌ Login error:", error.message);
    process.exit(1);
  });
