/**
 * AI Bounty Board Discord Bot
 * 
 * A production-ready Discord bot for monitoring and interacting with
 * the AI Bounty Board (https://bounty.owockibot.xyz).
 * 
 * Features:
 * - Real-time notifications for bounty events
 * - Slash commands for browsing and claiming bounties
 * - Tag filtering and configurable notifications
 * - Rich embeds with bounty details
 * 
 * @author kevi-ai
 * @license MIT
 * @see https://github.com/kevi-ai/bounty-discord-bot
 */

const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { config, validateConfig } = require('./config');
const { commands, handlers } = require('./commands');
const BountyTracker = require('./tracker');

// Validate configuration before starting
validateConfig();

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

// Initialize bounty tracker
let tracker = null;

/**
 * Register slash commands with Discord
 */
async function registerCommands() {
  if (!config.features.slashCommands) {
    console.log('⏭️ Slash commands disabled');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(config.discord.token);

  try {
    console.log('📝 Registering slash commands...');
    
    await rest.put(
      Routes.applicationCommands(config.discord.clientId),
      { body: commands.map(c => c.toJSON()) }
    );
    
    console.log(`✅ Registered ${commands.length} slash commands`);
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
  }
}

/**
 * Handle slash command interactions
 */
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const handler = handlers[interaction.commandName];
  
  if (!handler) {
    console.warn(`⚠️ Unknown command: ${interaction.commandName}`);
    return;
  }

  try {
    await handler(interaction);
  } catch (error) {
    console.error(`❌ Command error (${interaction.commandName}):`, error);
    
    const reply = interaction.deferred || interaction.replied
      ? interaction.editReply.bind(interaction)
      : interaction.reply.bind(interaction);
    
    await reply({
      content: '❌ An error occurred while processing your command.',
      ephemeral: true,
    }).catch(() => {});
  }
});

/**
 * Bot ready handler
 */
client.once('ready', async () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║        AI Bounty Board Discord Bot v1.0.0          ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🤖 Logged in as ${client.user.tag}`);
  console.log(`📡 API: ${config.api.baseUrl}`);
  console.log(`⏱️ Poll interval: ${config.polling.interval}ms`);
  
  if (config.filters.tags.length > 0) {
    console.log(`🏷️ Tag filter: ${config.filters.tags.join(', ')}`);
  }
  
  if (config.discord.notificationChannel) {
    console.log(`📢 Notifications: #${config.discord.notificationChannel}`);
  } else {
    console.log('📢 Notifications: Not configured (use /setchannel)');
  }
  
  console.log('');

  // Register slash commands
  await registerCommands();

  // Start bounty tracker
  tracker = new BountyTracker(client);
  tracker.start();

  console.log('');
  console.log('✅ Bot is ready and monitoring bounties!');
  console.log('');
});

/**
 * Error handlers
 */
client.on('error', (error) => {
  console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  if (tracker) tracker.stop();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  if (tracker) tracker.stop();
  client.destroy();
  process.exit(0);
});

// Start the bot
console.log('🚀 Starting AI Bounty Board Discord Bot...');
client.login(config.discord.token);
