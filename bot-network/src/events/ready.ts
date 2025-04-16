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
          status: "online",
        });
      } else {
        client2.user?.setPresence({
          activities: [
            {
              name: data.settings.status.text,
            },
          ],
          status: data.settings.status.type || "dnd",
        });
      }
    }

    // Enhanced Redis subscription logic
    try {
      const subscriber = client.duplicate();
      await subscriber.connect();
      await subscriber.pSubscribe(`__keyspace@0__:bots:${resourceId}`, async (event) => {
        if (event === "set" || event === "hset") {
          try {
            const updatedBotData = await client.get(`bots:${resourceId}`);
            if (updatedBotData) {
              const data = JSON.parse(updatedBotData);
              client2.user?.setPresence({
                ...(data.settings?.status?.text
                  ? {
                    activities: [
                      {
                        name: data.settings.status.text,
                      },
                    ],
                  }
                  : {}),
                status: data.settings?.status?.type || "online",
              });
            } else {
              console.warn(`⚠️ [Network: ${resourceId}] No data found for the updated key.`);
            }
          } catch (error) {
            console.error(`❌ [Network: ${resourceId}] Error fetching updated bot data:`, error);
          }
        } else {
          console.log(`️⚠️ [Network: ${resourceId}] Ignored event: ${event}`);
        }
      });


    } catch (err) {
      console.error(`❌ [Network: ${resourceId}] Failed to set up Redis subscriber:`, err);
    }
  },
};

export default event;