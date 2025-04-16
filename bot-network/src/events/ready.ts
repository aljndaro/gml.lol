import { color } from "../functions";
import { BotEvent } from "../types";
import { Client } from "discord.js";
import client from "../redis";

const event: BotEvent = {
  name: "ready",
  once: true,
  execute: async (client2: Client, resourceId: string) => {
    console.log(
      color("text", `💪 Logged in as ${color("variable", client2.user?.tag)}`)
    );

    // Set initial status
    const botData = await client.get(`bots:${resourceId}`);
    if (botData) {
      const data = JSON.parse(botData);
      if (!data.settings?.status?.text) {
        client2.user?.setPresence({
          activities: [],
          status: 'online'
        });
        return;
      }

      client2.user?.setPresence({
        activities: [
          {
            name: data.settings.status.text || "with drug dealers",
          },
        ],
        status: data.settings.status.type || "dnd",
      });
    }

    // Subscribe to status changes 
    const subscriber = client.duplicate();
    await subscriber.connect();

    await subscriber.subscribe(`botStatus:${resourceId}`, (message) => {
      const status = JSON.parse(message);
      client2.user?.setPresence({
        activities: [
          {
            name: status.text || "with drug dealers",
          }
        ],
        status: status.type || "dnd"
      });
    });
  }
};

export default event;