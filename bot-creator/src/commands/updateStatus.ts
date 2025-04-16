import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import client from "../redis";

const command: any = {
    command: new SlashCommandBuilder()
        .setName("status")
        .setDescription("Update the status of a bot.")
        .addSubcommand(subcommand =>
            subcommand.setName("update")
                .setDescription("Change the status.")
                .addStringOption(option => option.setName("resource-id").setDescription("The changes will apply to this bot").setRequired(true))
                .addStringOption(option => option.setName("text").setDescription("This will update the status text"))
                .addStringOption(option => option.setName("presence").setDescription("This will update the little circle icon next to the bot's activity status").addChoices({ name: "🌙 Idle", value: "idle" }, { name: "🟢 Online", value: "online" }, { name: "⛔️ Do Not Disturb", value: "dnd" }))
        )
        .addSubcommand(subcommand =>
            subcommand.setName("clear")
                .setDescription("Clears the status.")
                .addStringOption(option => option.setName("resource-id").setDescription("The changes will apply to this bot").setRequired(true))
        ),
    execute: async (interaction: any) => {
        const subcommand = interaction.options.getSubcommand();
        const resourceId = interaction.options.getString("resource-id");

        // Retrieve bot data from the database
        const botData = await client.get(`bots:${resourceId}`);
        if (!botData) {
            const errorEmbed = new EmbedBuilder()
                .setTitle("❌ Error")
                .setDescription("This bot could not be found in our database.")
                .setColor("Red")
                .setFields({ name: "User Inputted Resource ID", value: resourceId })
                .setTimestamp()
                .setFooter({ text: "If this is a mistake, please contact Gio." });
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const parsedBotData = JSON.parse(botData);

        // Check if the user owns the bot
        if (parsedBotData.ownerId !== interaction.user.id) {
            const errorEmbed = new EmbedBuilder()
                .setTitle("❌ Error")
                .setDescription("You do not own this bot.")
                .setFields({ name: "User Inputted Resource ID", value: resourceId })
                .setColor("Red")
                .setTimestamp()
                .setFooter({ text: "If this is a mistake, please contact Gio." });
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        if (subcommand === "update") {
            const text = interaction.options.getString("text");
            const presence = interaction.options.getString("presence") || "online";

            if (!text) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle("❌ Error")
                    .setDescription("Status Text was not included in the command.")
                    .setColor("Red")
                    .setFields({ name: "User Inputted Resource ID", value: resourceId })
                    .setTimestamp()
                    .setFooter({ text: "If this is a mistake, please contact Gio." });
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            await client.set(`bots:${resourceId}`, JSON.stringify({
                ...parsedBotData,
                settings: {
                    ...parsedBotData.settings,
                    status: {
                        text,
                        type: presence
                    }
                }
            }));

            const successEmbed = new EmbedBuilder()
                .setTitle("✅ Status Updated")
                .setAuthor({
                    name: interaction.user.username,
                    iconURL: interaction.user.avatarURL() as any,
                })
                .setColor("Green")

                .setDescription(`The status for bot with resource ID **${resourceId}** has been updated.`)
                .setFields(
                    { name: "Status Text", value: text },
                    { name: "Presence", value: presence }
                )
                .setTimestamp();

            interaction.reply({ embeds: [successEmbed] });
        } else if (subcommand === "clear") {
            // Remove only the status field from the bot's settings
            await client.set(`bots:${resourceId}`, JSON.stringify({
                ...parsedBotData,
                settings: {
                    ...parsedBotData.settings,
                    status: {
                        text: "",
                        type: parsedBotData.settings.status?.type ?? "online"
                    } // Clear the status field
                }
            }));

            const clearEmbed = new EmbedBuilder()
                .setTitle("✅ Status Cleared")
                .setAuthor({
                    name: interaction.user.username,
                    iconURL: interaction.user.avatarURL() as any,
                })
                .setColor("Green")

                .setDescription(`The status for bot with resource ID **${resourceId}** has been cleared.`)
                .setFooter({ text: "Please keep in mind that it will take some time for Discord register the cleared status." })
                .setTimestamp();

            interaction.reply({ embeds: [clearEmbed] });
        }
    }
};

export default command;