import dotenv from "dotenv";
dotenv.config();
import { Client, GatewayIntentBits } from "discord.js";
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState,
  StreamType,
} from "@discordjs/voice";
import { spawn } from "child_process";
import { access } from "fs/promises";

console.log("🎵 MUSIC BOT STARTING...");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Track active players for each guild
const activeConnections = new Map();

client.once("ready", () => {
  console.log(`✅ MUSIC BOT READY! Logged in as ${client.user.tag}`);
});

async function playAudio(url, voiceChannel, textChannel) {
  try {
    // Join voice channel
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    console.log("✅ Connected to voice channel");

    // Detect source
    const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
    const isSoundCloud = url.includes("soundcloud.com");

    let ytdlpArgs;

    if (isSoundCloud) {
      // SoundCloud - usually works better
      console.log("🎵 Detected SoundCloud");
      ytdlpArgs = ["-f", "bestaudio", "-o", "-", "--no-playlist", url];
    } else {
      // YouTube - try with age-bypass and different client
      console.log("🎵 Detected YouTube - trying with bypass...");
      ytdlpArgs = [
        "--cookies-from-browser",
        "chrome",
        "-f",
        "bestaudio/best",
        "-o",
        "-",
        "--no-playlist",
        "--no-check-certificates",
        "--extractor-args",
        "youtube:player_client=web",
        url,
      ];
    }

    console.log("🔍 Starting yt-dlp...");
    const ytdlp = spawn("yt-dlp", ytdlpArgs);

    // Pipe yt-dlp output to FFmpeg for proper encoding
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      "pipe:0",
      "-f",
      "opus",
      "-ar",
      "48000",
      "-ac",
      "2",
      "-b:a",
      "128k",
      "-vn",
      "pipe:1",
    ]);

    ytdlp.stdout.pipe(ffmpeg.stdin);

    const resource = createAudioResource(ffmpeg.stdout, {
      inputType: StreamType.OggOpus,
    });

    const player = createAudioPlayer();
    connection.subscribe(player);

    // Store active connection
    activeConnections.set(voiceChannel.guild.id, { connection, player });

    player.play(resource);

    textChannel.send("🎵 **Now Playing!**");

    player.on(AudioPlayerStatus.Playing, () => {
      console.log("🎵 Audio playing");
    });

    player.on(AudioPlayerStatus.Idle, () => {
      console.log("🎵 Finished");
      textChannel.send("⏹️ Finished!");
      setTimeout(() => {
        if (connection.state.status !== "destroyed") {
          connection.destroy();
        }
        activeConnections.delete(voiceChannel.guild.id);
      }, 1000);
    });

    player.on("error", (error) => {
      console.error("❌ Player error:", error);
      textChannel.send("❌ Playback error!");
      if (connection.state.status !== "destroyed") {
        connection.destroy();
      }
      activeConnections.delete(voiceChannel.guild.id);
    });

    // Error handling for processes
    ytdlp.stderr.on("data", (data) => {
      const msg = data.toString();
      if (msg.includes("ERROR")) {
        console.error(`yt-dlp error: ${msg}`);
      }
    });

    ytdlp.on("error", (error) => {
      console.error("❌ yt-dlp spawn error:", error);
      textChannel.send("❌ Failed to start download!");
      if (connection.state.status !== "destroyed") {
        connection.destroy();
      }
      activeConnections.delete(voiceChannel.guild.id);
    });

    ffmpeg.stderr.on("data", (data) => {
      const msg = data.toString();
      // Only log actual errors
      if (msg.toLowerCase().includes("error")) {
        console.error(`FFmpeg: ${msg}`);
      }
    });

    ffmpeg.on("error", (error) => {
      console.error("❌ FFmpeg error:", error);
    });
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  // !play command
  if (message.content.startsWith("!play")) {
    const url = message.content.slice(5).trim();
    if (!url) {
      return message.reply(
        "❌ Please provide a URL!\n" +
          "**Examples:**\n" +
          "`!play https://youtu.be/dQw4w9WgXcQ` (YouTube)\n" +
          "`!play https://soundcloud.com/...` (SoundCloud - more reliable!)",
      );
    }

    const voiceChannel = message.member?.voice.channel;
    if (!voiceChannel) return message.reply("❌ Join a voice channel first!");

    try {
      await message.channel.send("🔍 Loading...");
      await playAudio(url, voiceChannel, message.channel);
    } catch (error) {
      console.error("❌ Play error:", error);
      message.reply(
        "❌ Error playing music! Try:\n• A different video\n• SoundCloud instead (more reliable)\n• Wait 30 seconds and try again",
      );
      const connection = getVoiceConnection(message.guild.id);
      if (connection) connection.destroy();
      activeConnections.delete(message.guild.id);
    }
  }

  // !stop command
  if (message.content.startsWith("!stop")) {
    const active = activeConnections.get(message.guild.id);
    const connection = getVoiceConnection(message.guild.id);

    if (active || connection) {
      if (connection) connection.destroy();
      activeConnections.delete(message.guild.id);
      message.reply("⏹️ Stopped!");
    } else {
      message.reply("❌ Nothing is playing!");
    }
  }

  // !test command
  if (message.content.startsWith("!test")) {
    message.reply("✅ Bot is online!");
  }

  // !help command
  if (message.content.startsWith("!help")) {
    message.reply(
      `**🎵 Music Bot Commands:**\n` +
        `\`!play <url>\` - Play audio from URL\n` +
        `\`!stop\` - Stop playing and leave\n` +
        `\`!test\` - Test bot status\n\n` +
        `**Supported Sources:**\n` +
        `✅ SoundCloud (Most reliable!)\n` +
        `⚠️ YouTube (May have issues due to restrictions)\n\n` +
        `**Tips:**\n` +
        `• SoundCloud works better than YouTube\n` +
        `• If YouTube fails, try SoundCloud or wait 30 seconds\n` +
        `• Some videos may be region-locked`,
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
