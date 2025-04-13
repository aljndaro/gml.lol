import { color } from "../functions";
import { BotEvent } from "../types";
import { Client } from "discord.js";

const event: BotEvent = {
  name: "ready",
  once: true,
  execute: (client: Client) => {
    console.log(
      color("text", `💪 Logged in as ${color("variable", client.user?.tag)}`)
    );
    client.user?.setPresence({
      activities: [
        {
          name: `with drug dealers`,
        },
      ],
      status: "dnd",
    });
  },
};

export default event;