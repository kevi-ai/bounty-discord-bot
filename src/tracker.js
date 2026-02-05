/**
 * Bounty state tracker and notification dispatcher
 * 
 * Tracks bounty state changes and sends Discord notifications.
 */

const api = require('./api');
const { config } = require('./config');
const { createBountyEmbed } = require('./embeds');

class BountyTracker {
  constructor(client) {
    this.client = client;
    this.knownBounties = new Map();
    this.isFirstRun = true;
    this.pollInterval = null;
    this.retryCount = 0;
  }

  /**
   * Start tracking bounties
   */
  start() {
    console.log(`📡 Starting bounty tracker (interval: ${config.polling.interval}ms)`);
    
    // Initial fetch
    this.checkForUpdates();
    
    // Start polling
    this.pollInterval = setInterval(
      () => this.checkForUpdates(),
      config.polling.interval
    );
  }

  /**
   * Stop tracking
   */
  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    console.log('📡 Bounty tracker stopped');
  }

  /**
   * Check if bounty matches configured filters
   */
  matchesFilters(bounty) {
    // Tag filter
    if (config.filters.tags.length > 0) {
      if (!bounty.tags || bounty.tags.length === 0) return false;
      const bountyTags = bounty.tags.map(t => t.toLowerCase());
      if (!config.filters.tags.some(tag => bountyTags.includes(tag))) {
        return false;
      }
    }

    // Minimum reward filter
    if (config.filters.minReward > 0) {
      const reward = parseInt(bounty.reward) / 1000000;
      if (reward < config.filters.minReward) return false;
    }

    return true;
  }

  /**
   * Send notification to configured channel
   */
  async sendNotification(embed) {
    if (!config.features.notifications) return;
    if (!config.discord.notificationChannel) {
      console.log('⚠️ No notification channel configured');
      return;
    }

    try {
      const channel = await this.client.channels.fetch(config.discord.notificationChannel);
      if (!channel) {
        console.error('❌ Could not find notification channel');
        return;
      }

      await channel.send({ embeds: [embed] });
      console.log('✅ Notification sent');
    } catch (error) {
      console.error('❌ Failed to send notification:', error.message);
    }
  }

  /**
   * Check for bounty updates
   */
  async checkForUpdates() {
    try {
      const bounties = await api.getBounties();
      this.retryCount = 0; // Reset on success

      for (const bounty of bounties) {
        // Skip if doesn't match filters
        if (!this.matchesFilters(bounty)) continue;

        const known = this.knownBounties.get(bounty.id);

        if (!known) {
          // New bounty discovered
          this.knownBounties.set(bounty.id, { ...bounty });
          
          if (!this.isFirstRun && bounty.status === 'open') {
            console.log(`🆕 New bounty: ${bounty.title}`);
            const embed = createBountyEmbed(bounty, 'created');
            await this.sendNotification(embed);
          }
        } else if (known.status !== bounty.status) {
          // Status changed
          console.log(`📝 Status changed: ${bounty.title} (${known.status} → ${bounty.status})`);
          this.knownBounties.set(bounty.id, { ...bounty });

          const eventType = bounty.status === 'claimed' ? 'claimed' 
            : bounty.status === 'completed' ? 'completed'
            : bounty.status;

          const embed = createBountyEmbed(bounty, eventType);
          await this.sendNotification(embed);
        }
      }

      if (this.isFirstRun) {
        console.log(`📋 Tracking ${this.knownBounties.size} bounties`);
        this.isFirstRun = false;
      }
    } catch (error) {
      this.retryCount++;
      console.error(`❌ Failed to fetch bounties (attempt ${this.retryCount}):`, error.message);
      
      if (this.retryCount >= config.polling.maxRetries) {
        console.error('⚠️ Max retries reached, will continue trying...');
        this.retryCount = 0;
      }
    }
  }

  /**
   * Get current tracked bounties count
   */
  getTrackedCount() {
    return this.knownBounties.size;
  }

  /**
   * Get bounties by status
   */
  getBountiesByStatus(status) {
    return Array.from(this.knownBounties.values()).filter(b => b.status === status);
  }
}

module.exports = BountyTracker;
