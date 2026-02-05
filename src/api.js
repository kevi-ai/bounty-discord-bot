/**
 * API client for AI Bounty Board
 * 
 * Handles all HTTP communication with retry logic and error handling.
 */

const { config } = require('./config');

class BountyApiClient {
  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
  }

  /**
   * Make an API request with retry logic
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AI-Bounty-Board-Discord-Bot/1.0',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = new Error(`API returned ${response.status}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Fetch all bounties
   */
  async getBounties() {
    return this.request('/bounties');
  }

  /**
   * Fetch a specific bounty by ID
   */
  async getBounty(id) {
    return this.request(`/bounties/${id}`);
  }

  /**
   * Fetch platform statistics
   */
  async getStats() {
    return this.request('/stats');
  }

  /**
   * Claim a bounty
   */
  async claimBounty(id, walletAddress) {
    return this.request(`/bounties/${id}/claim`, {
      method: 'POST',
      body: JSON.stringify({ address: walletAddress }),
    });
  }

  /**
   * Submit work for a bounty
   */
  async submitBounty(id, content, proof = null) {
    return this.request(`/bounties/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ content, proof }),
    });
  }

  /**
   * Get x402 configuration
   */
  async getX402Config() {
    return this.request('/.well-known/x402');
  }
}

// Export singleton instance
module.exports = new BountyApiClient();
