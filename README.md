
# WhatsApp Bot

A powerful and customizable WhatsApp bot built with Node.js and @whiskeysockets/baileys

## Getting Started

Follow these instructions to set up and run your WhatsApp bot on your local machine or vps.

### Prerequisites

Make sure you have the following installed:

- **Node.js LTS** (v20 or later)
- **FFmpeg** (for media processing)
- **Git**
- **PM2** (optional, for running the bot in production mode)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/ShibamDey69/WhatsApp-Bot
   ```

2. **Navigate to the project directory:**

   ```bash
   cd WhatsApp-Bot
   ```

3. **Update the configuration:**

   Open the `src/config.json` file and add your owner numbers:

   ```json
   {
     "ownerNumbers": ["YOUR_NUMBER", "ANOTHER_NUMBER"]
   }
   ```

   Replace `YOUR_NUMBER` and `ANOTHER_NUMBER` with the actual WhatsApp numbers that should have owner permissions.

### Running the Bot

You can start the bot using either Node.js directly or with PM2 for production.

#### 1. Simple Node.js

   ```bash
   export SHIBAM && node src/index.js BOT_NUMBER
   ```

#### 2. Using PM2 (recommended for production)

   ```bash
   pm2 start ecosystem.config.js -- BOT_NUMBER
   ```

   Replace `BOT_NUMBER` with the actual number assigned to the bot.

### Additional Information

- **src/config.json**: Configuration file for the bot, where you can add owner numbers and other settings.

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

