import { ActionRowBuilder, Interaction, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
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
    }

    if (interaction.isButton()) {
      if (interaction.customId === "create") {
        const modal = new ModalBuilder()
          .setCustomId("tokenModal")
          .setTitle("🤖 Create Bot");
        const tokenInput = new TextInputBuilder()
          .setCustomId("tokenInput")
          .setLabel("Discord Token")
          .setRequired()
          .setStyle(TextInputStyle.Short);
        const clientInput = new TextInputBuilder()
          .setCustomId("clientInput")
          .setLabel("Bot's User ID")
          .setRequired()
          .setStyle(TextInputStyle.Short);
        const guildId = new TextInputBuilder()
          .setCustomId("guildId")
          .setLabel("Server ID")
          .setRequired()
          .setStyle(TextInputStyle.Short);

        const firstActionRow = new ActionRowBuilder().addComponents(tokenInput);
        const second = new ActionRowBuilder().addComponents(clientInput);
        const thrid = new ActionRowBuilder().addComponents(guildId);

        // Add inputs to the modal
        modal.addComponents(firstActionRow as any, second as any, thrid as any);
        await interaction.showModal(modal);


      }
    }
  }
}

export default event;
