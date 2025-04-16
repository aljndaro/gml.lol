import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, TextChannel } from "discord.js";

const command: any = {
    command: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("pong!"),

    execute: async (interaction: any) => {
        await interaction.reply("pong!")
    }

}
export default command;