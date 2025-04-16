import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, TextChannel } from "discord.js";

const command: any = {
    command: new SlashCommandBuilder()
        .setName("sendembed")
        .setDescription("Send the bot create embed to the current channel.")
        .addChannelOption(option => {
            return option
                .setName("channel")
                .setDescription("Text channel where the embed message will be sent.")
                .setRequired(true)
        })
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    execute: async (interaction: any) => {
        let selectedTextChannel = interaction.channel?.client.channels.cache.get(
            interaction.options.getChannel("channel")?.id as any
        ) as TextChannel;

        const embed = new EmbedBuilder()
            .setTitle("🤖 Create Discord Bot")
            .setDescription("You can get started by clicking on the button located below! \n\nIf you require assistance please feel free to DM <@996916060806709379> directly!")
            .setColor("LuminousVividPink")
            .setFooter({ text: "You cannot mention this system to anyone that is not in this server." });

        const createButton = new ButtonBuilder()
            .setCustomId("create")
            .setLabel("Create a bot")
            .setStyle(ButtonStyle.Success)
            .setEmoji("🤖");

        const messageRow = new ActionRowBuilder().addComponents(createButton);

        await selectedTextChannel.send({
            embeds: [embed],
            components: [messageRow as any]
        })
        await interaction.reply({
            content: "Sent Successfully!",
        }).then(() => {
            setTimeout(() => interaction.deleteReply(), 5000)
        })
    }

}
export default command;