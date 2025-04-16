import "./redis";
import {
  Client,
  GatewayIntentBits,
  Collection,
  PresenceData,
} from "discord.js";
import express from "express";
import { SlashCommand } from "./types";
import { readdirSync } from "fs";
import { join } from "path";
import client from "./redis";

require("dotenv").config();

const app = express()

// Create a separate subscriber for global bot watching
const globalSubscriber = client.duplicate();

interface BotSettings {
  status?: {
    text?: string;
    type?: 'online' | 'idle' | 'dnd' | 'invisible';
  };
}

export const bots = new Collection();

class Bot {
  public client: Client;
  public resourceId: string;
  public clientId: string;
  private subscriber: typeof client;

  constructor(token: string, resourceId: string, clientId: string) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
      ]
    });

    this.resourceId = resourceId;
    this.clientId = clientId;
    this.subscriber = client.duplicate();
    this.client.slashCommands = new Collection<string, SlashCommand>();

    this.client.login(token).then(() => {
      console.log(`[Network] Bot ${this.resourceId} logged in successfully`);
      this.setupHandlers();
    }).catch(error => {
      console.error(`[Network] Failed to login bot ${this.resourceId}: ${error}`);
      this.shutdownBot();
    });
  }

  private setupHandlers() {
    const handlersDir = join(__dirname, './handlers');
    readdirSync(handlersDir).forEach((handler) => {
      if (!handler.endsWith('.js')) return;
      if (handler.includes("command")) {
        require(`${handlersDir}/${handler}`)(
          this.client,
          this.resourceId,
          this.client.token, // Add the token here
          this.clientId
        );
      } else {
        require(`${handlersDir}/${handler}`)(this.client, this.resourceId);
      }
    });
  }

  async shutdownBot() {
    console.log(`[Network] Shutting down bot ${this.resourceId}`);
    try {
      await this.subscriber.unsubscribe();
      await this.subscriber.quit();
      await this.client.destroy();
      console.log(`[Network] ${this.resourceId} has shutdown successfully`);
      return bots.delete(this.resourceId);
    } catch (error) {
      console.error(`[Network Error] Error shutting down bot:`, error);
    }
  }
}

async function loadExistingBots() {
  try {
    // Get all bot keys
    const botKeys = await client.keys('bots:*');

    // Load each bot
    for (const key of botKeys) {
      const botData = await client.get(key);
      if (botData) {
        const data = JSON.parse(botData);
        if (!bots.has(data.resourceId)) {
          const bot = new Bot(data.botToken || data.token, data.resourceId, data.clientId);
          bots.set(data.resourceId, bot);
        }
      }
    }
    console.log(`[Network] Loaded ${bots.size} existing bots`);
  } catch (error) {
    console.error('[Network] Error loading existing bots:', error);
  }
}

// Global bot watching
globalSubscriber.subscribe('__keyspace@0__:bots:*', (err, count) => {
  if (err) console.error('[Network] Error subscribing to bot events:', err);
});

globalSubscriber.subscribe('__keyspace@0__:bots:*', async (message, channel) => {
  if (message === 'set' || message === 'hset') {
    try {
      const botKey = channel.split(':')[2];
      const botData = await client.get(`bots:${botKey}`);

      if (botData) {
        const data = JSON.parse(botData);
        if (!bots.has(data.resourceId)) {
          const bot = new Bot(data.botToken || data.token, data.resourceId, data.clientId);
          bots.set(data.resourceId, bot);
        }
      }
    } catch (error) {
      console.error('[Network] Error processing new bot:', error);
    }
  }
});

app.get('/', (req, res) => {
  res.status(200).json({ status: 'online', activeBots: bots.size });
});

app.listen(3000, async () => {
  console.log(`[Network] Bot networking server is online on port 3000.`);
  await loadExistingBots();
});

export default bots;