import "dotenv/config";
import { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder 
} from "discord.js";

import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior,
  getVoiceConnection,
} from "@discordjs/voice";

import play from "play-dl";

// --------------------
// 🔧 CLIENT
// --------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

console.log("🎧 Starting music bot...");

// --------------------
// 🎼 QUEUE SYSTEM
// --------------------
const queues = new Map(); // per guild queue

function getQueue(guildId) {
  if (!queues.has(guildId)) {
    queues.set(guildId, {
      songs: [],
      connection: null,
      player: null,
      loop: false,
      playing: false,
    });
  }
  return queues.get(guildId);
}

// --------------------
// 🎵 PLAY SONG
// --------------------
async function playSong(guildId) {
  const queue = getQueue(guildId);

  if (!queue.songs.length) {
    queue.playing = false;
    const conn = getVoiceConnection(guildId);
    if (conn) conn.destroy();
    return;
  }

  const song = queue.songs[0];

  if (!queue.connection) return;

  const stream = await play.stream(song.url);
  const resource = createAudioResource(stream.stream, {
    inputType: stream.type,
  });

  if (!queue.player) {
    queue.player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
    });

    queue.player.on(AudioPlayerStatus.Idle, () => {
      if (!queue.loop) queue.songs.shift();
      playSong(guildId);
    });

    queue.player.on("error", (err) => {
      console.error("Player error:", err);
      queue.songs.shift();
      playSong(guildId);
    });

    queue.connection.subscribe(queue.player);
  }

  queue.player.play(resource);
  queue.playing = true;
}

// --------------------
// 🚀 Commands
// --------------------
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const cmd = args.shift().toLowerCase();

  // --------------------
  // ▶️ !play
  // --------------------
  if (cmd === "!play") {
    const query = args.join(" ");
    if (!query) return message.channel.send("❌ Please provide a YouTube URL or search query.");

    const vc = message.member.voice.channel;
    if (!vc) return message.channel.send("❌ You must join a voice channel.");

    const queue = getQueue(message.guild.id);

    // Connect if needed
    if (!queue.connection) {
      queue.connection = joinVoiceChannel({
        channelId: vc.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });
    }

    // Resolve YouTube video
    let info;
    if (play.yt_validate(query) === "video") {
      info = await play.video_basic_info(query);
    } else {
      const results = await play.search(query, { limit: 1 });
      if (!results.length) return message.channel.send("❌ No results found.");
      info = await play.video_basic_info(results[0].url);
    }

    const song = {
      title: info.video_details.title,
      url: info.video_details.url,
    };

    queue.songs.push(song);
    message.channel.send(`🎵 **Added to queue:** ${song.title}`);

    if (!queue.playing) playSong(message.guild.id);
  }

  // --------------------
  // ⏭️ !skip
  // --------------------
  if (cmd === "!skip") {
    const queue = getQueue(message.guild.id);
    if (!queue.songs.length) return message.channel.send("❌ Nothing to skip.");

    queue.player?.stop();
    message.channel.send("⏭️ Skipped.");
  }

  // --------------------
  // ⏹️ !stop
  // --------------------
  if (cmd === "!stop") {
    const queue = getQueue(message.guild.id);
    queue.songs = [];
    queue.player?.stop();
    const conn = getVoiceConnection(message.guild.id);
    if (conn) conn.destroy();

    message.channel.send("🛑 Music stopped & queue cleared.");
  }

  // --------------------
  // ⏸️ !pause
  // --------------------
  if (cmd === "!pause") {
    const queue = getQueue(message.guild.id);
    queue.player?.pause();
    message.channel.send("⏸️ Paused.");
  }

  // --------------------
  // ▶️ !resume
  // --------------------
  if (cmd === "!resume") {
    const queue = getQueue(message.guild.id);
    queue.player?.unpause();
    message.channel.send("▶️ Resumed.");
  }

  // --------------------
  // 📜 !queue
  // --------------------
  if (cmd === "!queue") {
    const queue = getQueue(message.guild.id);
    if (!queue.songs.length) return message.channel.send("📭 Queue is empty.");

    const list = queue.songs
      .map((s, i) => `${i + 1}. ${s.title}`)
      .join("\n");

    message.channel.send(`📜 **Queue:**\n${list}`);
  }

  // --------------------
  // 🎶 !nowplaying
  // --------------------
  if (cmd === "!nowplaying") {
    const queue = getQueue(message.guild.id);
    if (!queue.songs.length) return message.channel.send("❌ Nothing playing.");

    message.channel.send(`🎶 **Now playing:** ${queue.songs[0].title}`);
  }

  // --------------------
  // ❌ !remove <index>
  // --------------------
  if (cmd === "!remove") {
    const queue = getQueue(message.guild.id);
    const index = parseInt(args[0], 10);

    if (!queue.songs[index - 1]) {
      return message.channel.send("❌ Invalid index.");
    }

    const removed = queue.songs.splice(index - 1, 1)[0];
    message.channel.send(`🗑️ Removed: **${removed.title}**`);
  }

  // --------------------
  // 🔁 !loop
  // --------------------
  if (cmd === "!loop") {
    const queue = getQueue(message.guild.id);
    queue.loop = !queue.loop;

    message.channel.send(
      queue.loop ? "🔁 Loop enabled." : "➡️ Loop disabled."
    );
  }
});

// --------------------
// 🚀 Login
// --------------------
client.once("ready", () => {
  console.log("✅ Music Bot Ready! Logged in as " + client.user.tag);
});

client.login(process.env.DISCORD_TOKEN);
