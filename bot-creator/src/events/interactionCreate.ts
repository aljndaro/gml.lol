import { Interaction } from "discord.js";
import { BotEvent } from "../types";
import client from "../redis";
import { Pika } from "pika-id";

const pika = new Pika(["bot"]);

const event: BotEvent = {
  name: "interactionCreate",
  execute: async (interaction: Interaction) => {
    //I will test with this to see if it is unnecessary.
    if (interaction.guild == null) return;
    //Handles commands
    if (interaction.isChatInputCommand()) {
      let command = interaction.client.slashCommands.get(
        interaction.commandName
      );
      if (!command) return;

      command.execute(interaction);
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === "tokenModal") {
        const submittedToken =
          interaction.fields.getTextInputValue("tokenInput");
        const allDocuments = await client.hGetAll("bots");
        for (const key in allDocuments) {
          const document = JSON.parse(allDocuments[key]); // Assuming the documents are stored as JSON strings
          if (document.token === submittedToken) {
            await interaction.reply({
              content: "This token is already in use.",
              ephemeral: true,
            });
            return;
          } else {
            const resourceId = pika.gen("bot");

            let pendingBotData = {
              botToken: submittedToken,
              resourceId: resourceId,
              ownerId: interaction.user.id,
              settings: {
                state: 1,
                status: {
                  text: " ",
                  type: "online",
                },
                guild: {
                  guildId: interaction.fields.getField("guildId").value,
                },
              },
            };
            //create bot in db
            try {
              await client.set(
                "bots:" + resourceId,
                JSON.stringify(pendingBotData)
              );
            } catch (error) {
              return interaction.reply({
                content:
                  "We ran into an issue while saving this bot to the database.",
                ephemeral: true,
              });
            }

            return interaction.reply({
              content: `Created your bot. Resource ID: ${pendingBotData.resourceId}`,
              ephemeral: true,
              components: [],
            });
          }
        }
      }
      if (interaction.customId === "userManageBot") {
        const resourceId = interaction.fields.getField("resourceId").value;

        let bot = JSON.parse((await client.get(`bots:${resourceId}`)) || "{}");

        if (!bot) {
          return interaction.reply({
            content: "This bot could not be found.",
            ephemeral: true,
          });
        }
        if (bot.ownerId !== interaction.user.id) {
          return interaction.reply({
            content: "You cannot manage this bot as you do not own it.",
            ephemeral: true,
          });
        }

        //check the bots current state
        //1 = online, 2 = restarting, 3 = offline

        const state = bot.state;
      }
    }
  },
};

export default event;
