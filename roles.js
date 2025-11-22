import 'dotenv/config';
import { checkLeaderboard } from './utils.js';
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

// Define your role thresholds
const roleThresholds = [
  { roleName: 'Bronze', minPoints: 0 },
  { roleName: 'Silver', minPoints: 100 },
  { roleName: 'Gold', minPoints: 500 },
  { roleName: 'Platinum', minPoints: 1000 },
  { roleName: 'Diamond', minPoints: 2000 },
  { roleName: 'Champion', minPoints: 4000 },
  { roleName: 'Grand Champion', minPoints: 7000 },
  { roleName: 'Supersonic Legend', minPoints: 11000 },
];

// Define role colors for creating new roles
const roleColors = {
  Bronze: '#CD7F32',
  Silver: '#C0C0C0',
  Gold: '#FFD700',
  Platinum: '#00BFFF',
  Diamond: '#0066FF',
  Champion: '#8A2BE2',
  'Grand Champion': '#FF0000',
  'Supersonic Legend': '#FFFFFF'
};

// Updates members roles based on current amount of points
export async function updateRoles(guildId, userId) {
  // Get server from Discord
  const guild = await client.guilds.fetch(guildId);
  // Get member from guild
  const member = await guild.members.fetch(userId);

  if (!member) return; // Reached if userId added to leaderboard doesn't match any in the server

  // Get users points total from leaderboard
  const points = checkLeaderboard(userId); 

  // Find the highest role user qualifies for
  let newRoleName = null;
  for (const threshold of roleThresholds) {
    if (points >= threshold.minPoints) {
      newRoleName = threshold.roleName;
    }
  }

  // If the user already has that role no need to update
  if (member.roles.cache.some(r => r.name === newRoleName)) return;

  // Remove old leaderboard roles
  const rolesToRemove = member.roles.cache.filter(r => roleThresholds.some(t => t.roleName === r.name));
  await member.roles.remove(rolesToRemove);

  // Find or create the role
  let role = guild.roles.cache.find(r => r.name === newRoleName);
  if (!role) {
    role = await guild.roles.create({
      name: newRoleName,
      color: roleColors[newRoleName] ?? '#FFFFFF',
      reason: 'Leaderboard role creation'
    });
  }

  // Add the new role
  await member.roles.add(role);
}

client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('Bot logged in!'))
  .catch(err => console.error('Login failed:', err));