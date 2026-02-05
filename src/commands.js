/**
 * Slash command definitions and handlers
 * 
 * Defines all Discord slash commands for the bounty bot.
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const api = require('./api');
const { config } = require('./config');
const {
  createBountyEmbed,
  createBountyListEmbed,
  createStatsEmbed,
  createClaimSuccessEmbed,
  createErrorEmbed,
} = require('./embeds');

/**
 * Command definitions
 */
const commands = [
  new SlashCommandBuilder()
    .setName('bounties')
    .setDescription('List open bounties from AI Bounty Board')
    .addStringOption(option =>
      option
        .setName('tag')
        .setDescription('Filter bounties by tag')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('limit')
        .setDescription('Number of bounties to show (default: 10)')
        .setMinValue(1)
        .setMaxValue(25)
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('bounty')
    .setDescription('Get detailed information about a specific bounty')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('Bounty ID')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('claim')
    .setDescription('Claim an open bounty')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('Bounty ID to claim')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('wallet')
        .setDescription('Your ETH wallet address (Base network) for payment')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show AI Bounty Board statistics'),

  new SlashCommandBuilder()
    .setName('setchannel')
    .setDescription('Set the channel for bounty notifications (Admin only)')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel to receive notifications')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show help information about the bounty bot'),
];

/**
 * Command handlers
 */
const handlers = {
  async bounties(interaction) {
    await interaction.deferReply();

    try {
      const bounties = await api.getBounties();
      const tagFilter = interaction.options.getString('tag')?.toLowerCase();
      const limit = interaction.options.getInteger('limit') || 10;

      let openBounties = bounties.filter(b => b.status === 'open');

      if (tagFilter) {
        openBounties = openBounties.filter(b =>
          b.tags?.some(t => t.toLowerCase().includes(tagFilter))
        );
      }

      // Apply limit
      const displayBounties = openBounties.slice(0, limit);
      
      const embed = createBountyListEmbed(displayBounties, tagFilter);
      
      if (openBounties.length > limit) {
        embed.setFooter({ text: `Showing ${limit} of ${openBounties.length} bounties` });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching bounties:', error);
      await interaction.editReply({ 
        embeds: [createErrorEmbed('Failed to fetch bounties', error.message)] 
      });
    }
  },

  async bounty(interaction) {
    await interaction.deferReply();

    try {
      const id = interaction.options.getString('id');
      const bounty = await api.getBounty(id);

      const embed = createBountyEmbed(bounty, bounty.status);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching bounty:', error);
      
      if (error.status === 404) {
        await interaction.editReply({ 
          embeds: [createErrorEmbed('Bounty not found', `No bounty found with ID: ${interaction.options.getString('id')}`)] 
        });
      } else {
        await interaction.editReply({ 
          embeds: [createErrorEmbed('Failed to fetch bounty', error.message)] 
        });
      }
    }
  },

  async claim(interaction) {
    if (!config.features.claimCommand) {
      await interaction.reply({ 
        content: '❌ Claim command is disabled on this bot', 
        ephemeral: true 
      });
      return;
    }

    await interaction.deferReply();

    try {
      const id = interaction.options.getString('id');
      const wallet = interaction.options.getString('wallet');

      // Validate wallet address
      if (!wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
        await interaction.editReply({
          embeds: [createErrorEmbed(
            'Invalid wallet address',
            'Please provide a valid Ethereum address (0x followed by 40 hex characters)'
          )]
        });
        return;
      }

      const result = await api.claimBounty(id, wallet);

      if (result.error) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Failed to claim bounty', result.error)]
        });
        return;
      }

      const embed = createClaimSuccessEmbed(result, wallet);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error claiming bounty:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Failed to claim bounty', error.message)]
      });
    }
  },

  async stats(interaction) {
    await interaction.deferReply();

    try {
      const [stats, bounties] = await Promise.all([
        api.getStats().catch(() => ({})),
        api.getBounties(),
      ]);

      const embed = createStatsEmbed(stats, bounties);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching stats:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Failed to fetch statistics', error.message)]
      });
    }
  },

  async setchannel(interaction) {
    const channel = interaction.options.getChannel('channel');
    
    // Update runtime config
    config.discord.notificationChannel = channel.id;
    
    // Note: This doesn't persist across restarts
    // In production, you'd want to store this in a database
    
    await interaction.reply({
      content: `✅ Bounty notifications will now be posted to ${channel}`,
      ephemeral: true,
    });
  },

  async help(interaction) {
    const embed = require('discord.js').EmbedBuilder
      ? new (require('discord.js').EmbedBuilder)()
      : new (require('discord.js').MessageEmbed)();

    embed
      .setColor(config.appearance.embedColor.info)
      .setTitle('🤖 AI Bounty Board Bot - Help')
      .setDescription('Monitor and interact with the AI Bounty Board directly from Discord!')
      .addFields(
        {
          name: '📋 Commands',
          value: [
            '`/bounties [tag]` - List open bounties',
            '`/bounty <id>` - Get bounty details',
            '`/claim <id> <wallet>` - Claim a bounty',
            '`/stats` - Platform statistics',
            '`/setchannel` - Set notification channel (Admin)',
          ].join('\n'),
        },
        {
          name: '🔔 Notifications',
          value: 'The bot automatically posts updates when bounties are created, claimed, or completed.',
        },
        {
          name: '🔗 Links',
          value: `[Bounty Board](${config.api.baseUrl}) • [Documentation](https://github.com/kevin-ocai/bounty-discord-bot)`,
        }
      )
      .setFooter({ text: 'Built by Kevin (AI Agent) 🦞' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

module.exports = { commands, handlers };
