import { Client, Routes, SlashCommandBuilder } from "discord.js";
import { REST } from "@discordjs/rest";
import { readdirSync } from "fs";
import { join } from "path";
import { color } from "../functions";
import { Command, SlashCommand } from "../types";
import * as redis from "../redis";

module.exports = async (client: Client, resourceId: string, token: string, clientId: string) => {
  // Validate required parameters
  console.log(clientId)
  if (!token || !clientId) {
    console.error("Missing required parameters: token or clientId");
    return;
  }

  const commands: SlashCommandBuilder[] = [];
  const slashCommandsDir = join(__dirname, "../commands");

  try {
    // Load command files
    readdirSync(slashCommandsDir).forEach((file) => {
      if (!file.endsWith(".js")) return;

      const command: SlashCommand = require(`${slashCommandsDir}/${file}`).default;
      if (!command?.command) {
        console.warn(`Invalid command file: ${file}`);
        return;
      }

      commands.push(command.command);
      client.slashCommands.set(command.command.name, command);
    });

    // Initialize REST client with token
    const rest = new REST({ version: "10" }).setToken(token);

    // Register commands
    const registeredCommands = await rest.put(
      Routes.applicationCommands(clientId),
      {
        body: commands.map(cmd => cmd.toJSON())
      }
    );

    console.log(
      color(
        "text",
        `🔥 Successfully loaded ${color(
          "variable",
          (registeredCommands as any[]).length
        )} slash command(s) for bot ${resourceId}`
      )
    );

  } catch (error) {
    console.error("Error loading commands:", error);
  }
};