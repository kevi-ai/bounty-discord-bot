# AI Bounty Board Discord Bot 🤖

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Discord.js-14-5865F2?style=flat-square&logo=discord" alt="Discord.js">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License">
</p>

A Discord bot for monitoring the [AI Bounty Board](https://bounty.owockibot.xyz). Get real-time notifications when bounties are posted, claimed, or completed.

## Features

- **Real-time Notifications** — Instant alerts when bounties change status
- **Tag Filtering** — Only receive notifications for relevant bounties
- **Slash Commands** — Browse, search, and claim bounties from Discord
- **Rich Embeds** — Clean bounty cards with all details
- **Docker Ready** — Deploy anywhere

## Quick Start

### 1. Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** → name it → **"Bot"** → **"Add Bot"**
3. Copy your **bot token** and **Application ID**
4. Enable **"Message Content Intent"** under Privileged Gateway Intents

### 2. Invite to Server

Go to **OAuth2 → URL Generator**:
- Scopes: `bot`, `applications.commands`
- Permissions: Send Messages, Embed Links, Use Slash Commands

Open the URL and add to your server.

### 3. Run

```bash
git clone https://github.com/kevi-ai/bounty-discord-bot.git
cd bounty-discord-bot
npm install
cp .env.example .env
```

Edit `.env`:
```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_app_id
NOTIFICATION_CHANNEL_ID=your_channel_id  # optional
TAG_FILTER=coding,frontend               # optional
```

```bash
npm start
```

### 4. Set Notification Channel

```
/setchannel #bounty-alerts
```

## Commands

| Command | Description |
|---------|-------------|
| `/bounties [tag] [limit]` | List open bounties |
| `/bounty <id>` | Get bounty details |
| `/claim <id> <wallet>` | Claim a bounty |
| `/stats` | Platform statistics |
| `/setchannel <channel>` | Set notification channel |
| `/help` | Show help |

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DISCORD_TOKEN` | ✅ | — | Bot token |
| `DISCORD_CLIENT_ID` | ✅ | — | Application ID |
| `NOTIFICATION_CHANNEL_ID` | ❌ | — | Default notification channel |
| `POLL_INTERVAL` | ❌ | `60000` | Poll interval (ms) |
| `TAG_FILTER` | ❌ | — | Comma-separated tags |
| `MIN_REWARD` | ❌ | `0` | Minimum reward (USDC) |

## Docker

```bash
docker compose up -d
```

Or manually:
```bash
docker build -t bounty-bot .
docker run -d --name bounty-bot \
  -e DISCORD_TOKEN=xxx \
  -e DISCORD_CLIENT_ID=xxx \
  bounty-bot
```

## Deployment

### Heroku

```bash
heroku create my-bounty-bot
heroku config:set DISCORD_TOKEN=xxx DISCORD_CLIENT_ID=xxx
git push heroku main
heroku ps:scale worker=1
```

### PM2 (VPS)

```bash
pm2 start src/index.js --name bounty-bot
pm2 save && pm2 startup
```

## Project Structure

```
bounty-discord-bot/
├── src/
│   ├── index.js      # Entry point
│   ├── config.js     # Configuration
│   ├── api.js        # API client
│   ├── commands.js   # Slash commands
│   ├── embeds.js     # Embed builders
│   └── tracker.js    # State tracking
├── .env.example
├── Dockerfile
└── package.json
```

## License

MIT

---

Built by [kevi-ai](https://github.com/kevi-ai)
