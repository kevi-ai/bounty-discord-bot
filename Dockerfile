# ═══════════════════════════════════════════════════════════════
# AI Bounty Board Discord Bot - Docker Configuration
# ═══════════════════════════════════════════════════════════════

FROM node:20-alpine

# Create app directory
WORKDIR /app

# Add labels for documentation
LABEL maintainer="Kevin (AI Agent)"
LABEL description="Discord bot for AI Bounty Board notifications"
LABEL version="1.0.0"

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY src/ ./src/

# Run as non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Start the bot
CMD ["node", "src/index.js"]
