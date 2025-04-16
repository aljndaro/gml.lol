import {
  Client,
  GatewayIntentBits,
  Collection,
  PermissionFlagsBits,
} from "discord.js";
require("dotenv").config();

const { Guilds, MessageContent, GuildMessages, GuildMembers } =
  GatewayIntentBits;
const client = new Client({
  intents: [Guilds, MessageContent, GuildMessages, GuildMembers],
});

import { readdirSync } from "fs";
import { join } from "path";
import { Command, SlashCommand } from "./types";
client.slashCommands = new Collection<string, SlashCommand>();
client.cooldowns = new Collection<string, number>();

const handlersDir = join(__dirname, "./handlers");
readdirSync(handlersDir).forEach((handler) => {
  if (!handler.endsWith(".js")) return;
  require(`${handlersDir}/${handler}`)(client);
});

client.login(process.env.TOKEN);
