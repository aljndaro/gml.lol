import {
  SlashCommandBuilder,
  ChannelType,
  TextChannel,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { SlashCommand } from "../types";

const command: any = {
  command: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Shows the bot's ping")
    .addChannelOption((option) => {
      return option
        .setName("channel")
        .setDescription("Text channel where the embed message will be sent.")
        .setRequired(true);
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  execute: async (interaction: any) => {
    let selectedTextChannel = interaction.channel?.client.channels.cache.get(
      interaction.options.getChannel("channel")?.id as any
    ) as TextChannel;
    const embed = new EmbedBuilder()
      .setTitle("Create a new bot on Lyte")
      .setDescription(
        "You can get started by clicking on the button located below! \n\nIf you require assistance please feel free to DM <@575252669443211264> directly!"
      )
      .setColor("Purple")
      .setTimestamp();

    const create = new ButtonBuilder()
      .setCustomId("create")
      .setLabel("Create a bot")
      .setStyle(ButtonStyle.Success)
      .setEmoji("🤖");

    const row = new ActionRowBuilder().addComponents(create);
    await selectedTextChannel.send({
      embeds: [embed],
      components: [row as any],
    });
    await interaction.reply({
      content: "done",
    });

    // const collectorFilter = (i: any) => i.user.id === interaction.user.id;
    // try {
    //   const confirmation = (await response.awaitMessageComponent({
    //     filter: collectorFilter,
    //   })) as any;

    //   if ((confirmation?.customId as any) === "create") {
    //     const SendConfirmationEmbedToUser = new EmbedBuilder()
    //       .setTitle("New Bot created on Lyte")
    //       .setDescription(
    //         `Hey there ${interaction.user.username}, \n\nWe've just wanted to let you know that there has been a bot created on your Discord account. You can manage your bot by running the Examply command. \n\nIf you have any questions about your bot, please feel free to reply to this message.`
    //       )
    //       .setColor("Green")
    //       .setFooter({
    //         text: "Don't recognize this activity? Reply to this message to contact support.",
    //       });
    //     interaction.user.send({ embeds: [SendConfirmationEmbedToUser] });
    //     await confirmation.reply({
    //       content: `Created a bot successfully.`,
    //       components: [],
    //     });
    //   }
    // } catch (e) {
    //   await interaction.editReply({
    //     content: "Confirmation not received within 1 minute, cancelling",
    //     components: [],
    //   });
    // }
  },
};

export default command;
