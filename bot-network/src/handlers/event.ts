import { Client } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { color } from "../functions";
import { BotEvent } from "../types";

module.exports = async (client: Client, resourceId: string) => {
  let eventsDir = join(__dirname, "../events");

  readdirSync(eventsDir).forEach((file) => {
    if (!file.endsWith(".js")) return;
    let event: BotEvent = require(`${eventsDir}/${file}`).default;
    event.once
      ? client.once(event.name, (...args) => event.execute(...args, resourceId))
      : client.on(event.name, (...args) => event.execute(...args, resourceId));
    console.log(
      color(
        "text",
        `🌠 Successfully loaded event ${color("variable", event.name)}`
      )
    );
  });
};