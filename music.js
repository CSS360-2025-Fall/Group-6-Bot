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

console.log("🎵 MUSIC BOT STARTING...");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Queue system - store queue for each guild
const guildQueues = new Map();

// Store active processes for cleanup
const activeProcesses = new Map();

client.once("ready", () => {
  console.log(`✅ MUSIC BOT READY! Logged in as ${client.user.tag}`);
});

// Get or create queue for a guild
function getQueue(guildId) {
  if (!guildQueues.has(guildId)) {
    guildQueues.set(guildId, {
      songs: [],
      isPlaying: false,
      connection: null,
      player: null,
      textChannel: null,
    });
  }
  return guildQueues.get(guildId);
}

// Helper function to cleanup processes
function cleanupProcesses(guildId) {
  const processes = activeProcesses.get(guildId);
  if (processes) {
    try {
      if (processes.ytdlp && !processes.ytdlp.killed) {
        processes.ytdlp.kill("SIGKILL");
      }
      if (processes.ffmpeg && !processes.ffmpeg.killed) {
        processes.ffmpeg.kill("SIGKILL");
      }
    } catch (err) {
      // Ignore cleanup errors
    }
    activeProcesses.delete(guildId);
  }
}

async function playNextInQueue(guildId) {
  const queue = getQueue(guildId);

  if (queue.songs.length === 0) {
    queue.isPlaying = false;
    queue.textChannel?.send(
      "📭 Queue is empty! Add more songs with `!play <url>`",
    );

    // Leave after 30 seconds if no new songs
    setTimeout(() => {
      const currentQueue = getQueue(guildId);
      if (currentQueue.songs.length === 0 && currentQueue.connection) {
        currentQueue.connection.destroy();
        currentQueue.textChannel?.send(
          "👋 Leaving voice channel due to inactivity.",
        );
        guildQueues.delete(guildId);
        activeProcesses.delete(guildId);
      }
    }, 30000);
    return;
  }

  const song = queue.songs[0];
  queue.isPlaying = true;

  try {
    console.log(`🎵 Playing: ${song.title}`);

    // Detect source
    const isSoundCloud = song.url.includes("soundcloud.com");
    let ytdlpArgs;

    if (isSoundCloud) {
      ytdlpArgs = ["-f", "bestaudio", "-o", "-", "--no-playlist", song.url];
    } else {
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
        song.url,
      ];
    }

    const ytdlp = spawn("yt-dlp", ytdlpArgs);
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

    // Store processes for cleanup
    activeProcesses.set(guildId, { ytdlp, ffmpeg });

    ytdlp.stdout.pipe(ffmpeg.stdin);

    // Handle pipe errors silently
    ytdlp.stdout.on("error", () => {});
    ffmpeg.stdin.on("error", () => {});

    const resource = createAudioResource(ffmpeg.stdout, {
      inputType: StreamType.OggOpus,
    });

    if (!queue.player) {
      queue.player = createAudioPlayer();
      queue.connection.subscribe(queue.player);

      queue.player.on(AudioPlayerStatus.Idle, () => {
        console.log("🎵 Song finished, playing next...");
        const finishedSong = queue.songs.shift(); // Remove finished song
        console.log(`Removed from queue: ${finishedSong?.title}`);
        console.log(`Songs remaining: ${queue.songs.length}`);

        if (queue.songs.length > 0) {
          // Small delay before playing next to avoid issues
          setTimeout(() => {
            playNextInQueue(guildId);
          }, 500);
        } else {
          queue.isPlaying = false;
          queue.textChannel?.send("📭 Queue finished!");
        }
      });

      queue.player.on("error", (error) => {
        console.error("❌ Player error:", error);
        queue.textChannel?.send("❌ Playback error! Skipping to next song...");
        queue.songs.shift();
        playNextInQueue(guildId);
      });
    }

    queue.player.play(resource);
    queue.textChannel?.send(
      `🎵 **Now Playing:** ${song.title}\n📝 Requested by: ${song.requester}`,
    );

    // Error handling - silent
    ytdlp.stderr.on("data", () => {});
    ytdlp.on("error", () => {});
    ffmpeg.stderr.on("data", () => {});
    ffmpeg.on("error", () => {});
  } catch (error) {
    console.error("❌ Play error:", error);
    queue.textChannel?.send("❌ Error playing song! Skipping...");
    queue.songs.shift();
    playNextInQueue(guildId);
  }
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const guildId = message.guild.id;

  // !play command - Add to queue
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

    const queue = getQueue(guildId);
    queue.textChannel = message.channel;

    // Add song to queue
    const song = {
      url: url,
      title: url.includes("soundcloud") ? "SoundCloud Track" : "YouTube Video",
      requester: message.author.tag,
    };

    queue.songs.push(song);

    // Join voice channel if not connected
    if (!queue.connection) {
      try {
        queue.connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: guildId,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });
        await entersState(
          queue.connection,
          VoiceConnectionStatus.Ready,
          30_000,
        );
        console.log("✅ Connected to voice channel");
      } catch (error) {
        console.error("❌ Failed to join:", error);
        return message.reply("❌ Failed to join voice channel!");
      }
    }

    if (queue.songs.length === 1 && !queue.isPlaying) {
      // Start playing if this is the first song
      message.channel.send("🔍 Loading and playing...");
      playNextInQueue(guildId);
    } else {
      // Song added to queue
      message.channel.send(
        `✅ **Added to queue (#${queue.songs.length}):** ${song.title}\nRequested by: ${song.requester}`,
      );
    }
  }

  // !queue command - Show current queue
  if (message.content.startsWith("!queue")) {
    const queue = getQueue(guildId);

    if (queue.songs.length === 0) {
      return message.reply("📭 Queue is empty! Add songs with `!play <url>`");
    }

    let queueMessage = "**🎵 Current Queue:**\n\n";
    queue.songs.forEach((song, index) => {
      if (index === 0) {
        queueMessage += `**▶️ Now Playing:** ${song.title}\nRequested by: ${song.requester}\n\n`;
      } else {
        queueMessage += `**${index}.** ${song.title}\nRequested by: ${song.requester}\n`;
      }
    });

    queueMessage += `\n📊 Total songs in queue: ${queue.songs.length}`;
    message.reply(queueMessage);
  }

  // !skip command - Skip current song
  if (message.content.startsWith("!skip")) {
    const queue = getQueue(guildId);

    if (!queue.isPlaying || queue.songs.length === 0) {
      return message.reply("❌ Nothing is playing!");
    }

    const skippedSong = queue.songs[0];
    message.channel.send(`⏭️ Skipping: ${skippedSong.title}`);

    // Clean up old processes first
    cleanupProcesses(guildId);

    // Stop current player to trigger Idle event
    if (queue.player) {
      queue.player.stop();
    }
  }

  // !clear command - Clear queue
  if (message.content.startsWith("!clear")) {
    const queue = getQueue(guildId);

    if (queue.songs.length === 0) {
      return message.reply("❌ Queue is already empty!");
    }

    const count = queue.songs.length;
    queue.songs = [];
    queue.isPlaying = false;

    if (queue.player) {
      queue.player.stop();
    }

    message.reply(`🗑️ Cleared ${count} song(s) from queue!`);
  }

  // !stop command - Stop and leave
  if (message.content.startsWith("!stop")) {
    const queue = getQueue(guildId);

    if (!queue.connection) {
      return message.reply("❌ Nothing is playing!");
    }

    // Clean up processes
    cleanupProcesses(guildId);

    queue.songs = [];
    queue.isPlaying = false;

    if (queue.connection) {
      queue.connection.destroy();
    }

    guildQueues.delete(guildId);
    message.reply("⏹️ Stopped and left voice channel!");
  }

  // !nowplaying or !np command
  if (
    message.content.startsWith("!nowplaying") ||
    message.content.startsWith("!np")
  ) {
    const queue = getQueue(guildId);

    if (!queue.isPlaying || queue.songs.length === 0) {
      return message.reply("❌ Nothing is playing!");
    }

    const current = queue.songs[0];
    message.reply(
      `🎵 **Now Playing:**\n${current.title}\n👤 Requested by: ${current.requester}\n\n` +
        `📊 Songs in queue: ${queue.songs.length - 1}`,
    );
  }

  // !test command
  if (message.content.startsWith("!test")) {
    message.reply("✅ Bot is online!");
  }

  // !help command
  if (message.content.startsWith("!help")) {
    message.reply(
      `**🎵 Music Bot Commands:**\n\n` +
        `**Queue System:**\n` +
        `\`!play <url>\` - Add song to queue and play\n` +
        `\`!queue\` - Show current queue\n` +
        `\`!skip\` - Skip current song\n` +
        `\`!clear\` - Clear entire queue\n` +
        `\`!nowplaying\` or \`!np\` - Show current song\n` +
        `\`!stop\` - Stop playing and leave\n` +
        `\`!test\` - Test bot status\n\n` +
        `**Supported Sources:**\n` +
        `✅ SoundCloud (Most reliable!)\n` +
        `⚠️ YouTube (May have issues)\n\n` +
        `**Tips:**\n` +
        `• Songs play automatically one after another\n` +
        `• Use \`!queue\` to see what's coming next\n` +
        `• SoundCloud works better than YouTube`,
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
