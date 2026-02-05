/**
 * Configuration module for AI Bounty Board Discord Bot
 */

require('dotenv').config();

const config = {
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    notificationChannel: process.env.NOTIFICATION_CHANNEL_ID || null,
  },
  api: {
    baseUrl: process.env.BOUNTY_API_URL || 'https://bounty.owockibot.xyz',
    timeout: parseInt(process.env.API_TIMEOUT) || 10000,
  },
  polling: {
    interval: parseInt(process.env.POLL_INTERVAL) || 60000,
    retryDelay: parseInt(process.env.RETRY_DELAY) || 5000,
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
  },
  filters: {
    tags: process.env.TAG_FILTER
      ? process.env.TAG_FILTER.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
      : [],
    minReward: parseFloat(process.env.MIN_REWARD) || 0,
  },
  features: {
    notifications: process.env.ENABLE_NOTIFICATIONS !== 'false',
    slashCommands: process.env.ENABLE_SLASH_COMMANDS !== 'false',
    claimCommand: process.env.ENABLE_CLAIM_COMMAND !== 'false',
  },
  appearance: {
    embedColor: {
      created: 0x00FF00,
      claimed: 0xFFA500,
      completed: 0x0099FF,
      expired: 0xFF0000,
      info: 0x5865F2,
      error: 0xED4245,
      success: 0x57F287,
    },
    statusEmoji: {
      open: '🟢',
      claimed: '🟡',
      completed: '✅',
      expired: '⏰',
    },
  },
};

function validateConfig() {
  const errors = [];
  if (!config.discord.token) errors.push('DISCORD_TOKEN is required');
  if (!config.discord.clientId) errors.push('DISCORD_CLIENT_ID is required');
  if (config.polling.interval < 10000) errors.push('POLL_INTERVAL must be at least 10000ms');
  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }
}

module.exports = { config, validateConfig };
