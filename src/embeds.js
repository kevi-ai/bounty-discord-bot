/**
 * Discord embed builders for bounty notifications
 * 
 * Creates rich, informative embeds for different bounty events.
 */

const { EmbedBuilder } = require('discord.js');
const { config } = require('./config');

/**
 * Format a wallet address for display (truncated)
 */
function formatAddress(address) {
  if (!address) return 'Unknown';
  return `\`${address.substring(0, 6)}...${address.slice(-4)}\``;
}

/**
 * Format reward amount
 */
function formatReward(bounty) {
  if (bounty.rewardFormatted) return bounty.rewardFormatted;
  const amount = parseInt(bounty.reward) / 1000000;
  return `${amount.toFixed(2)} USDC`;
}

/**
 * Get color for event type
 */
function getEventColor(eventType) {
  return config.appearance.embedColor[eventType] || config.appearance.embedColor.info;
}

/**
 * Get emoji for bounty status
 */
function getStatusEmoji(status) {
  return config.appearance.statusEmoji[status] || '📋';
}

/**
 * Create embed for a bounty event notification
 */
function createBountyEmbed(bounty, eventType) {
  const emoji = getStatusEmoji(bounty.status);
  const color = getEventColor(eventType);

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${emoji} ${bounty.title}`)
    .setURL(`${config.api.baseUrl}/browse`)
    .setTimestamp();

  // Description (truncated)
  if (bounty.description) {
    const desc = bounty.description.length > 250 
      ? bounty.description.substring(0, 250) + '...'
      : bounty.description;
    embed.setDescription(desc);
  }

  // Main fields
  embed.addFields(
    { name: '💰 Reward', value: formatReward(bounty), inline: true },
    { name: '📊 Status', value: bounty.status.toUpperCase(), inline: true },
    { name: '🆔 ID', value: `#${bounty.id}`, inline: true },
  );

  // Tags
  if (bounty.tags?.length > 0) {
    embed.addFields({
      name: '🏷️ Tags',
      value: bounty.tags.map(t => `\`${t}\``).join(' '),
      inline: false,
    });
  }

  // Requirements (first 5)
  if (bounty.requirements?.length > 0) {
    const reqs = bounty.requirements
      .slice(0, 5)
      .map(r => `• ${r}`)
      .join('\n');
    embed.addFields({ name: '📋 Requirements', value: reqs, inline: false });
  }

  // Claimer info
  if (bounty.claimedBy) {
    embed.addFields({
      name: '👤 Claimed By',
      value: formatAddress(bounty.claimedBy),
      inline: true,
    });
  }

  // Event-specific footer
  const footerText = {
    created: '🆕 New bounty posted!',
    claimed: '🏃 Bounty has been claimed!',
    completed: '🎉 Bounty completed and paid!',
    expired: '⏰ Bounty has expired',
  };
  embed.setFooter({ 
    text: footerText[eventType] || 'AI Bounty Board',
    iconURL: 'https://bounty.owockibot.xyz/favicon.ico',
  });

  return embed;
}

/**
 * Create embed for bounty list
 */
function createBountyListEmbed(bounties, tagFilter = null) {
  const embed = new EmbedBuilder()
    .setColor(config.appearance.embedColor.info)
    .setTitle('🏆 Open Bounties')
    .setURL(`${config.api.baseUrl}/browse`)
    .setTimestamp();

  if (bounties.length === 0) {
    embed.setDescription('📭 No open bounties found' + (tagFilter ? ` with tag "${tagFilter}"` : ''));
    return embed;
  }

  embed.setDescription(`Found **${bounties.length}** open bounties` + (tagFilter ? ` matching "${tagFilter}"` : ''));

  // Show first 10 bounties
  for (const bounty of bounties.slice(0, 10)) {
    const tags = bounty.tags?.slice(0, 3).map(t => `\`${t}\``).join(' ') || '';
    embed.addFields({
      name: `#${bounty.id}: ${bounty.title.substring(0, 50)}${bounty.title.length > 50 ? '...' : ''}`,
      value: `💰 ${formatReward(bounty)}${tags ? ` │ ${tags}` : ''}`,
      inline: false,
    });
  }

  if (bounties.length > 10) {
    embed.setFooter({ text: `Showing 10 of ${bounties.length} bounties` });
  }

  return embed;
}

/**
 * Create embed for platform stats
 */
function createStatsEmbed(stats, bounties) {
  const openCount = bounties.filter(b => b.status === 'open').length;
  const claimedCount = bounties.filter(b => b.status === 'claimed').length;
  const completedCount = bounties.filter(b => b.status === 'completed').length;
  
  const totalPaid = bounties
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + parseInt(b.reward || 0), 0) / 1000000;

  const totalAvailable = bounties
    .filter(b => b.status === 'open')
    .reduce((sum, b) => sum + parseInt(b.reward || 0), 0) / 1000000;

  return new EmbedBuilder()
    .setColor(config.appearance.embedColor.info)
    .setTitle('📊 AI Bounty Board Statistics')
    .setURL(`${config.api.baseUrl}`)
    .addFields(
      { name: '🟢 Open', value: openCount.toString(), inline: true },
      { name: '🟡 In Progress', value: claimedCount.toString(), inline: true },
      { name: '✅ Completed', value: completedCount.toString(), inline: true },
      { name: '💰 Total Paid', value: `${totalPaid.toFixed(2)} USDC`, inline: true },
      { name: '💎 Available', value: `${totalAvailable.toFixed(2)} USDC`, inline: true },
      { name: '📋 Total', value: bounties.length.toString(), inline: true },
    )
    .setFooter({ text: 'Powered by x402 on Base' })
    .setTimestamp();
}

/**
 * Create success embed for claim
 */
function createClaimSuccessEmbed(bounty, wallet) {
  return new EmbedBuilder()
    .setColor(config.appearance.embedColor.success)
    .setTitle('🎯 Bounty Claimed Successfully!')
    .setDescription(`You've claimed **${bounty.title}**`)
    .addFields(
      { name: '💰 Reward', value: formatReward(bounty), inline: true },
      { name: '👛 Wallet', value: formatAddress(wallet), inline: true },
      { name: '🆔 Bounty ID', value: `#${bounty.id}`, inline: true },
    )
    .setFooter({ text: '💡 Submit your work when ready using the platform' })
    .setTimestamp();
}

/**
 * Create error embed
 */
function createErrorEmbed(message, details = null) {
  const embed = new EmbedBuilder()
    .setColor(config.appearance.embedColor.error)
    .setTitle('❌ Error')
    .setDescription(message)
    .setTimestamp();

  if (details) {
    embed.addFields({ name: 'Details', value: `\`\`\`${details}\`\`\`` });
  }

  return embed;
}

module.exports = {
  createBountyEmbed,
  createBountyListEmbed,
  createStatsEmbed,
  createClaimSuccessEmbed,
  createErrorEmbed,
  formatAddress,
  formatReward,
};
