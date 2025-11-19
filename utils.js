import 'dotenv/config';
import fs from 'fs';

export async function DiscordRequest(endpoint, options) {
  // append endpoint to root API URL
  const url = 'https://discord.com/api/v10/' + endpoint;
  // Stringify payloads
  if (options.body) options.body = JSON.stringify(options.body);
  // Use fetch to make requests
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'User-Agent': 'DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)',
    },
    ...options
  });
  // throw API errors
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  // return original response
  return res;
}

export async function InstallGlobalCommands(appId, commands) {
  // API endpoint to overwrite global commands
  const endpoint = `applications/${appId}/commands`;

  try {
    // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
    await DiscordRequest(endpoint, { method: 'PUT', body: commands });
  } catch (err) {
	console.log(process.env.DISCORD_TOKEN);  
    console.error(err);
  }
}

// Simple method that returns a random emoji from list
export function getRandomEmoji() {
  const emojiList = ['😭','😄','😌','🤓','😎','😤','🤖','😶‍🌫️','🌏','📸','💿','👋','🌊','✨'];
  return emojiList[Math.floor(Math.random() * emojiList.length)];
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Load and parse the leaderboard data from JSON file to be displayed to users
// Expects: key specifying which field to sort by, and n number of top entries to display
export function getLeaderboard(key, n) {
  const rawData = fs.readFileSync('./data/leaderboard.json', 'utf-8');
  const leaderboard = JSON.parse(rawData);

  // If leaderboard is empty, return message
  if (leaderboard.length === 0) {
      return 'Leaderboard is empty.';
  }

  // Sort by key descending
  leaderboard.sort((a, b) => b[key] - a[key]);

  // If there arent enough entries, adjust n
  if (leaderboard.length < n) {
      n = leaderboard.length;
  }

  // Create leaderboard string
  let result = 'Leaderboard:\n';

  // Add top n entries to result
  leaderboard.slice(0, n).forEach((entry, index) => {
      result += (`#${index + 1}: ${entry.user} - ${entry.points} points - ${entry.games_played} games played`);
      if (index < n - 1) {
          result += ('\n');
      }
  });

  // Return completed leaderboard as string
  return result;
}

// Updated leaderboard data after a game. Will also create new entry if user not found
// By default, adds 1 to games played
export function updateLeaderboard(userId, pointsToAdd, gamesPlayedToAdd = 1) {
  const rawData = fs.readFileSync('./data/leaderboard.json', 'utf-8');
  const leaderboard = JSON.parse(rawData);

  // Find user entry
  let userEntry = leaderboard.find(entry => entry.user === userId);

  // If not found, create new entry
  if (!userEntry) {
      userEntry = {user: userId, points: pointsToAdd, games_played: gamesPlayedToAdd};
      leaderboard.push(userEntry);
  } else {
    // If found update points and games played
    userEntry.points += pointsToAdd;
    userEntry.games_played += gamesPlayedToAdd;
  }

  // Write updated leaderboard back to file
  fs.writeFileSync('./data/leaderboard.json', JSON.stringify(leaderboard, null, 2));
}

// Checks leaderboard data for specific user and field
// If not field specified, will return user's points
export function checkLeaderboard(userId, key = points) {
  const leaderboardFile = path.join(__dirname, 'data', 'leaderboard.json');
  const leaderboard = JSON.parse(rawData);

  // Find user entry
  const userEntry = leaderboard.find(entry => entry.user === userId);

  // If not found, return null
  if (!userEntry) {
    return null;
  } else {
    // If found return requested key value
    return userEntry[key];
  }
}