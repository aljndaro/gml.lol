import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ColorResolvable,
  Embed,
  EmbedBuilder,
  Interaction,
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
  Webhook,
  WebhookClient,
} from "discord.js";
import { BotEvent } from "../types";
import { Pika } from "pika-id";
import { DeploymentTarget, Hop, RestartPolicy, RuntimeType } from "@onehop/js";
const token =
  "ptk_c182NDYwNTYzM2I0MjMxMDg2ZTYwYzI1OWMzMmFmZTY2N18yMjE4NDg0NzMzNjI3NTU5OTM";

let hop = new Hop(token);
const pika = new Pika(["bot"]);
import { LogSnag } from "@logsnag/node";
import { db } from "../firebase";
import moment from "moment";
process.on("uncaughtException", function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});
const logSnag = new LogSnag({
  token: "7c33065c3879906cff5a08bc98a0de57",
  project: "lyte",
});
const event: BotEvent = {
  name: "interactionCreate",
  execute: async (interaction: Interaction) => {
    if (interaction.guild == null) {
      return;
    }
    if (interaction.isChatInputCommand()) {
      let command = interaction.client.slashCommands.get(
        interaction.commandName
      );
      if (!command) return;

      command.execute(interaction);
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId === "tokenModal") {
        const tryToFindtokenInDB = await db
          .collection("bots")
          .where(
            "botToken",
            "==",
            interaction.fields.getField("tokenInput").value
          );
        if ((await tryToFindtokenInDB.get()).docs[0]) {
          await interaction.reply({
            content:
              "There is already a bot on lyte with this token! Contact Team Lyte if this is an issue.",
            ephemeral: true,
          });
        } else {
          try {
            const pika = new Pika(["bot"]);

            const rid = pika.gen("bot");
            await db
              .collection("bots")
              .doc(rid)
              .create({
                botToken: interaction.fields.getField("tokenInput").value,
                branding: true,
                resourceId: rid,
                botOwnerId: interaction.user.id,
                region: "us-west-1",
                settings: {
                  status: {
                    text: "Thanks for using Lyte :)",
                    type: "dnd",
                  },
                  guild: {
                    guildId: interaction.fields.getField("guildId").value,
                  },
                },
              });
            const bot = (await db.collection("bots").doc(rid).get()).data();
            const SendConfirmationEmbedToUser = new EmbedBuilder()
              .setTitle("New Bot created on Lyte")
              .setDescription(
                `Hey there ${interaction.user.username}, \n\nWe've just wanted to let you know that there has been a bot created on your Discord account.\n\nIf you have any questions about your bot, please feel free to contact us by using the bot in our server.`
              )
              .addFields({
                name: "Resource ID - Needed for support!",
                value: bot!.resourceId,
              })
              .setColor("Green")
              .setFooter({
                text: "Don't recognize this activity? Contact Lyte Support on our [website](https://lyteapp.us).",
              });
            interaction.user.send({ embeds: [SendConfirmationEmbedToUser] });

            const webhookclient = new WebhookClient({
              id: "1216499025029759028",
              token:
                "yoiK8DLrf5SKkvuc1BllY4zbd5L-u-uL37_M4gzQEQaa-Rg6-w_6IQXvHJdZeQzMbPK5",
            });
            const currentTimestamp = Math.floor(Date.now() / 1000);

            const embed = new EmbedBuilder()
              .setTitle("New Bot Created")
              .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.avatarURL() as any,
              })
              .setThumbnail(interaction.user.avatarURL())
              .setDescription("New Action on Central Bot Server")
              .setFields(
                {
                  name: "Resource Id",
                  value: "```" + `${rid}` + "```",
                },
                {
                  name: "Guild Id",
                  value:
                    "```" +
                    `${interaction.fields.getField("guildId").value}` +
                    "```",
                },
                {
                  name: "Owner Tag",
                  value: `<@${interaction.user.id}>`,
                },
                {
                  name: "Region",
                  value: "```" + "US-WEST-1" + "```",
                },
                {
                  name: "Timestamp",
                  value: `<t:${currentTimestamp}:F>`,
                }
              )
              .setTimestamp();

            await webhookclient.send({
              embeds: [embed],
            });
            return interaction.reply({
              content: `Successfully created your bot! Please make sure to store these credentials that are being sent to your DM's because these will be needed when contacting support. \n\nOn the behalf of Team Lyte, we'd like to thank you for choosing Lyte out of all competitors! It really does mean the world to us..`,
              components: [],
              ephemeral: true,
            });
          } catch (e) {
            await interaction.reply(`${e}`);
          }
        }
      }
      if (interaction.customId === "account-modal") {
        const userId = interaction.fields.getField("userid-input").value;
        console.log(userId);

        const bans: string[] = [];

        const findBotCreationLimitations = await db
          .collection("limitations")
          .doc(`${userId}-botcreation`)
          .get();
        const findCommandsLimitations = await db
          .collection("limitations")
          .doc(`${userId}-commands`)
          .get();
        const findWebsiteLimitations = await db
          .collection("limitations")
          .doc(`${userId}-web`)
          .get();
        if (findWebsiteLimitations.exists) {
          bans.push("<@&1208864193831510076>");
        }
        if (findBotCreationLimitations.exists) {
          console.log(findBotCreationLimitations.data());

          bans.push("<@&1206104395599708180>");
        }
        if (findCommandsLimitations.exists) {
          bans.push("<@&1206104552378597407>");
          console.log(findCommandsLimitations.data());
        }
        const findUsersBots = await db
          .collection("bots")
          .where("botOwnerId", "==", userId)
          .get();

        let buttons = [];
        let color;

        switch (bans.length) {
          case 3:
            color = "Red" as ColorResolvable;
            break;
          case 2:
            color = "Orange" as ColorResolvable;
            break;
          case 1:
            color = "Yellow" as ColorResolvable;
            break;
          case 0:
            color = "Green" as ColorResolvable;
            break;
          default:
            color = "Random" as ColorResolvable;
        }
        if (!findWebsiteLimitations.exists) {
          // User is not banned from bot creation, show ban button
          const websiteBanButton = new ButtonBuilder()
            .setCustomId("admin-ban-web-" + userId)
            .setEmoji("🛡️")
            .setStyle(ButtonStyle.Danger)
            .setLabel("Website Ban");

          buttons.push(websiteBanButton);
        } else {
          // User is banned from bot creation, show unban button
          const websiteUnbanButton = new ButtonBuilder()
            .setCustomId("admin-unban-web-" + userId)
            .setEmoji("🛡️")
            .setStyle(ButtonStyle.Success)
            .setLabel("Website Unban");
          buttons.push(websiteUnbanButton);
        }
        if (!findBotCreationLimitations.exists) {
          // User is not banned from bot creation, show ban button
          const botBanButton = new ButtonBuilder()
            .setCustomId("admin-ban-bot-" + userId)
            .setEmoji("🛡️")
            .setStyle(ButtonStyle.Danger)
            .setLabel("Bot Creation Ban");

          buttons.push(botBanButton);
        } else {
          // User is banned from bot creation, show unban button
          const botUnbanButton = new ButtonBuilder()
            .setCustomId("admin-unban-bot-" + userId)
            .setEmoji("🛡️")
            .setStyle(ButtonStyle.Success)
            .setLabel("Bot Creation Unban");
          buttons.push(botUnbanButton);
        }

        if (!findCommandsLimitations.exists) {
          // User is not banned from commands, show ban button
          const commandsBanButton = new ButtonBuilder()
            .setCustomId("admin-ban-commands-" + userId)
            .setEmoji("🛡️")
            .setStyle(ButtonStyle.Danger)

            .setLabel("Commands Ban");
          buttons.push(commandsBanButton);
        } else {
          // User is banned from commands, show unban button
          const commandsUnbanButton = new ButtonBuilder()
            .setCustomId("admin-unban-commands-" + userId)
            .setEmoji("🛡️")
            .setStyle(ButtonStyle.Success)

            .setLabel("Commands Unban");
          buttons.push(commandsUnbanButton);
        }
        try {
          const user = await interaction.client.users.fetch(userId as any);
          const embed = new EmbedBuilder()
            .setTitle(`🔍 User Information Generated`)
            .setColor(color)
            .setDescription(
              "If you are trying to run multiple buttons please make sure to dismiss this message and relookup the user. This is to ensure a zero bug panel."
            );

          if (
            user.id == "853014417327128596" ||
            user.id == "996916060806709379" ||
            user.id == "754794464056442893" ||
            user.id == "1050562744795004990"
          ) {
            embed.setDescription(
              "### This user is currently employed at Lyte!"
            );
          }

          embed
            .setThumbnail(user?.avatarURL() || null)
            .addFields(
              {
                name: "Username",
                value: user.username,
              },
              {
                name: "User Account",
                value: `<@${user.id}> `,
              },
              {
                name: "Bans",
                value:
                  bans.length == 0
                    ? "This user has no bans on Lyte."
                    : bans.join(" "),
              },
              {
                name: "Total Owned Bots",
                value: `${findUsersBots.size}`,
              }
            )

            .setTimestamp()
            .setFooter({
              text: `Report any issues to Alex`,
              iconURL: interaction.client?.user.avatarURL() || undefined,
            });
          await interaction.reply({
            components: [new ActionRowBuilder().addComponents(buttons) as any],
            embeds: [embed],
            ephemeral: true,
          });
        } catch (err) {
          console.log(err);
        }

        const intervalId = setInterval(async () => {
          let bans2 = [];

          const findBotCreationLimitations = await db
            .collection("limitations")
            .doc(`${userId}-botcreation`)
            .get();
          const findCommandsLimitations = await db
            .collection("limitations")
            .doc(`${userId}-commands`)
            .get();
          const findWebsiteLimitations = await db
            .collection("limitations")
            .doc(`${userId}-web`)
            .get();
          if (findWebsiteLimitations.exists) {
            bans2.push("<@&1208864193831510076>");
          }
          if (findBotCreationLimitations.exists) {
            console.log(findBotCreationLimitations.data());

            bans2.push("<@&1206104395599708180>");
          }
          if (findCommandsLimitations.exists) {
            bans2.push("<@&1206104552378597407>");
            console.log(findCommandsLimitations.data());
          }
          const findUsersBots = await db
            .collection("bots")
            .where("botOwnerId", "==", userId)
            .get();

          let buttons = [];

          if (!findWebsiteLimitations.exists) {
            // User is not banned from bot creation, show ban button
            const websiteBanButton = new ButtonBuilder()
              .setCustomId("admin-ban-web-" + userId)
              .setEmoji("🛡️")
              .setStyle(ButtonStyle.Danger)
              .setLabel("Website Ban");

            buttons.push(websiteBanButton);
          } else {
            // User is banned from bot creation, show unban button
            const websiteUnbanButton = new ButtonBuilder()
              .setCustomId("admin-unban-web-" + userId)
              .setEmoji("🛡️")
              .setStyle(ButtonStyle.Success)
              .setLabel("Website Unban");
            buttons.push(websiteUnbanButton);
          }
          if (!findBotCreationLimitations.exists) {
            // User is not banned from bot creation, show ban button
            const botBanButton = new ButtonBuilder()
              .setCustomId("admin-ban-bot-" + userId)
              .setEmoji("🛡️")
              .setStyle(ButtonStyle.Danger)
              .setLabel("Bot Creation Ban");

            buttons.push(botBanButton);
          } else {
            // User is banned from bot creation, show unban button
            const botUnbanButton = new ButtonBuilder()
              .setCustomId("admin-unban-bot-" + userId)
              .setEmoji("🛡️")
              .setStyle(ButtonStyle.Success)
              .setLabel("Bot Creation Unban");
            buttons.push(botUnbanButton);
          }

          if (!findCommandsLimitations.exists) {
            // User is not banned from commands, show ban button
            const commandsBanButton = new ButtonBuilder()
              .setCustomId("admin-ban-commands-" + userId)
              .setEmoji("🛡️")
              .setStyle(ButtonStyle.Danger)

              .setLabel("Commands Ban");
            buttons.push(commandsBanButton);
          } else {
            // User is banned from commands, show unban button
            const commandsUnbanButton = new ButtonBuilder()
              .setCustomId("admin-unban-commands-" + userId)
              .setEmoji("🛡️")
              .setStyle(ButtonStyle.Success)

              .setLabel("Commands Unban");
            buttons.push(commandsUnbanButton);
          }
          try {
            let color;

            switch (bans2.length) {
              case 0:
                color = "Green" as ColorResolvable;
                break;
              case 1:
                color = "Yellow" as ColorResolvable;
                break;
              case 2:
                color = "Orange" as ColorResolvable;
                break;
              case 3:
                color = "Red" as ColorResolvable;
                break;

              default:
                color = "Blurple" as ColorResolvable;
            }
            const user = await interaction.client.users.fetch(userId as any);
            const embed = new EmbedBuilder()
              .setTitle(`🔍 User Information Generated`)
              .setColor(color)
              .setDescription(
                "If you are trying to run multiple buttons please make sure to dismiss this message and relookup the user. This is to ensure a zero bug panel."
              );

            if (
              user.id == "853014417327128596" ||
              user.id == "996916060806709379" ||
              user.id == "754794464056442893" ||
              user.id == "1050562744795004990"
            ) {
              embed.setDescription(
                "### This user is currently employed at Lyte!"
              );
            }

            embed
              .setThumbnail(user?.avatarURL() || null)
              .addFields(
                {
                  name: "Username",
                  value: user.username,
                },
                {
                  name: "User Account",
                  value: `<@${user.id}> `,
                },
                {
                  name: "Bans",
                  value:
                    bans.length == 0
                      ? "This user has no bans on Lyte."
                      : bans.join(" "),
                },
                {
                  name: "Total Owned Bots",
                  value: `${findUsersBots.size}`,
                }
              )
              .setTimestamp()
              .setFooter({
                text: `Report any issues to Alex`,
                iconURL: interaction.client?.user.avatarURL() || undefined,
              });
            await interaction.editReply({
              components: [
                new ActionRowBuilder().addComponents(buttons) as any,
              ],
              embeds: [embed],
            });
          } catch (err) {
            console.log(err);
          }
        }, 2000);
        return setTimeout(() => {
          clearInterval(intervalId);
        }, 30000);
      }
      if (interaction.customId === "bot-modal") {
        const resourceId =
          interaction.fields.getField("resourceId-admin").value;
        console.log(resourceId);
        const findBot = await db
          .collection("bots")
          .doc(resourceId as any)
          .get();
        const bot2 = (
          await db
            .collection("bots")
            .doc(resourceId as any)
            .get()
        ).data();

        if (!findBot.exists) {
          return;
        }
        const checkIfRestarted = await db
          .collection("bots")
          .where("resourceId", "==", resourceId)
          .where("region", "==", "restarting")
          .get();
        const checkIfStopped = await db
          .collection("bots")
          .where("resourceId", "==", resourceId)
          .where("region", "==", "stopped")
          .get();

        let buttons = [];

        if (!checkIfRestarted.docs[0]) {
          const botBanButton = new ButtonBuilder()
            .setCustomId("admin-restart-bot-" + resourceId)
            .setEmoji("🔄")
            .setStyle(ButtonStyle.Primary)
            .setLabel("Restart Bot");

          buttons.push(botBanButton);
        } else {
          // User is banned from bot creation, show unban button
          const botUnbanButton = new ButtonBuilder()
            .setCustomId("guh")
            .setEmoji("🛡️")
            .setDisabled(true)
            .setStyle(ButtonStyle.Secondary)
            .setLabel("Bot is Restarting");
          buttons.push(botUnbanButton);
        }

        if (!checkIfStopped.docs[0]) {
          // User is not banned from commands, show ban button
          const commandsBanButton = new ButtonBuilder()
            .setCustomId("admin-stop-bot-" + resourceId)
            .setEmoji("❌")
            .setStyle(ButtonStyle.Danger)

            .setLabel("Stop Bot");
          buttons.push(commandsBanButton);
        } else {
          // User is banned from commands, show unban button

          const commandsUnbanButton = new ButtonBuilder()
            .setCustomId("admin-start-bot-" + resourceId)
            .setEmoji("✅")
            .setStyle(ButtonStyle.Success)
            .setLabel("Start Bot");
          buttons.push(commandsUnbanButton);
        }
        const deleteBanButton = new ButtonBuilder()
          .setCustomId("admin-delete-bot-" + resourceId)
          .setEmoji("🛡️")
          .setStyle(ButtonStyle.Danger)
          .setLabel("Delete Bot");

        buttons.push(deleteBanButton);
        const bot = await interaction.client.users.fetch(
          bot2!.settings.clientInfo.userId
        );
        const regionDropdown = new StringSelectMenuBuilder()
          .setCustomId(`region-change-${resourceId}`)
          .setPlaceholder(`${findBot.data()!.region}`)
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel("LOCALHOST - DEVELOPEMENT PURPOSES")
              .setValue("local")
              .setDefault(findBot.data()!.region == "local" ? true : false)
              .setEmoji("🇺🇸"),
            new StringSelectMenuOptionBuilder()
              .setLabel("US-WEST-1")
              .setValue("us-west-1")
              .setDefault(findBot.data()!.region == "us-west-1" ? true : false)
              .setEmoji("🇺🇸"),
            new StringSelectMenuOptionBuilder()
              .setLabel("US-WEST-BACKUP")
              .setValue("us-west-backup")
              .setDefault(
                findBot.data()!.region == "us-west-backup" ? true : false
              )
              .setEmoji("🇺🇸"),
            new StringSelectMenuOptionBuilder()
              .setLabel("US-EAST-1")
              .setValue("us-east-1")
              .setDefault(findBot.data()!.region == "us-east-1" ? true : false)
              .setEmoji("🇺🇸")
          );

        const embed = new EmbedBuilder()
          .setTitle(`🔍 User Information Generated`)
          .setColor("Random")
          .setDescription(
            "If you are trying to run multiple buttons please make sure to dismiss this message and relookup the user. This is to ensure a zero bug panel."
          );

        if (
          bot.id == "853014417327128596" ||
          bot.id == "996916060806709379" ||
          bot.id == "754794464056442893" ||
          bot.id == "1050562744795004990"
        ) {
          embed.setDescription("### This bot verified at Lyte!");
        }

        embed
          .setThumbnail(bot?.avatarURL() || null)
          .addFields(
            {
              name: "Username",
              value: bot.username,
            },
            {
              name: "Bot's Account",
              value: `<@${bot.id}> `,
            },
            {
              name: "Owner's ID",
              value: bot2!.botOwnerId,
            },
            {
              name: "Total Commands Ran",
              value: `${bot2!.commandsRan}`,
            }
          )
          .setTimestamp()
          .setFooter({
            text: `Report any issues to Alex`,
            iconURL: interaction.client?.user.avatarURL() || undefined,
          });
        await interaction.reply({
          components: [
            new ActionRowBuilder().addComponents(buttons) as any,
            new ActionRowBuilder().addComponents(regionDropdown),
          ],
          embeds: [embed],
          ephemeral: true,
        });

        try {
          interaction.deferReply();
          const intervalId = setInterval(async () => {
            if (!(await db.collection("bots").doc(resourceId).get()).exists) {
              return interaction.deleteReply();
            }
            const checkIfRestarted = await db
              .collection("bots")
              .where("resourceId", "==", resourceId)
              .where("region", "==", "restarting")
              .get();
            const checkIfStopped = await db
              .collection("bots")
              .where("resourceId", "==", resourceId)
              .where("region", "==", "stopped")
              .get();

            let buttons = [];

            if (!checkIfRestarted.docs[0]) {
              const botBanButton = new ButtonBuilder()
                .setCustomId("admin-restart-bot-" + resourceId)
                .setEmoji("🔄")
                .setStyle(ButtonStyle.Primary)
                .setLabel("Restart Bot");

              buttons.push(botBanButton);
            } else {
              // User is banned from bot creation, show unban button
              const botUnbanButton = new ButtonBuilder()
                .setCustomId("guh")
                .setEmoji("🛡️")
                .setDisabled(true)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Bot is Restarting");
              buttons.push(botUnbanButton);
            }

            if (!checkIfStopped.docs[0]) {
              // User is not banned from commands, show ban button
              const commandsBanButton = new ButtonBuilder()
                .setCustomId("admin-stop-bot-" + resourceId)
                .setEmoji("❌")
                .setStyle(ButtonStyle.Danger)

                .setLabel("Stop Bot");
              buttons.push(commandsBanButton);
            } else {
              // User is banned from commands, show unban button

              const commandsUnbanButton = new ButtonBuilder()
                .setCustomId("admin-start-bot-" + resourceId)
                .setEmoji("✅")
                .setStyle(ButtonStyle.Success)
                .setLabel("Start Bot");
              buttons.push(commandsUnbanButton);
            }

            const deleteBanButton = new ButtonBuilder()
              .setCustomId("admin-delete-bot-" + resourceId)
              .setEmoji("🛡️")
              .setStyle(ButtonStyle.Danger)
              .setLabel("Delete Bot");

            buttons.push(deleteBanButton);
            const bot = await interaction.client.users.fetch(
              bot2!.settings.clientInfo.userId
            );
            const regionDropdown = new StringSelectMenuBuilder()
              .setCustomId(`region-change-${resourceId}`)
              .setPlaceholder(`${findBot.data()!.region}`)
              .addOptions(
                new StringSelectMenuOptionBuilder()
                  .setLabel("LOCALHOST - DEVELOPEMENT PURPOSES")
                  .setValue("local")
                  .setDefault(findBot.data()!.region == "local" ? true : false)
                  .setEmoji("🇺🇸"),
                new StringSelectMenuOptionBuilder()
                  .setLabel("US-WEST-1")
                  .setValue("us-west-1")
                  .setDefault(
                    findBot.data()!.region == "us-west-1" ? true : false
                  )
                  .setEmoji("🇺🇸"),
                new StringSelectMenuOptionBuilder()
                  .setLabel("US-WEST-BACKUP")
                  .setValue("us-west-backup")
                  .setDefault(
                    findBot.data()!.region == "us-west-backup" ? true : false
                  )
                  .setEmoji("🇺🇸"),
                new StringSelectMenuOptionBuilder()
                  .setLabel("US-EAST-1")
                  .setValue("us-east-1")
                  .setDefault(
                    findBot.data()!.region == "us-east-1" ? true : false
                  )
                  .setEmoji("🇺🇸")
              );
            const embed = new EmbedBuilder()
              .setTitle(`🔍 User Information Generated`)
              .setColor("Random")
              .setDescription(
                "If you are trying to run multiple buttons please make sure to dismiss this message and relookup the user. This is to ensure a zero bug panel."
              );

            if (
              bot.id == "853014417327128596" ||
              bot.id == "996916060806709379" ||
              bot.id == "754794464056442893" ||
              bot.id == "1050562744795004990"
            ) {
              embed.setDescription("### This bot verified at Lyte!");
            }

            embed
              .setThumbnail(bot?.avatarURL() || null)
              .addFields(
                {
                  name: "Username",
                  value: bot.username,
                },
                {
                  name: "Bot's Account",
                  value: `<@${bot.id}> `,
                },
                {
                  name: "Owner's ID",
                  value: bot2!.botOwnerId,
                },
                {
                  name: "Total Commands Ran",
                  value: `${bot2!.commandsRan}`,
                }
              )
              .setTimestamp()
              .setFooter({
                text: `Report any issues to Alex`,
                iconURL: interaction.client?.user.avatarURL() || undefined,
              });
            try {
              await interaction.editReply({
                components: [
                  new ActionRowBuilder().addComponents(buttons) as any,
                  new ActionRowBuilder().addComponents(regionDropdown),
                ],

                embeds: [embed],
              });
            } catch (error) {
              console.log(error);
            }
          }, 5000);
          if (!(await db.collection("bots").doc(resourceId).get()).exists) {
            return setTimeout(() => {
              clearInterval(intervalId);
            });
          } else {
            return setTimeout(() => {
              clearInterval(intervalId);
            }, 30000);
          }
        } catch (err) {
          console.log(err);
        }
      }
    } else if (interaction.isButton()) {
      if (interaction.customId === "create") {
        const modal = new ModalBuilder()
          .setCustomId("tokenModal")
          .setTitle("Create a bot on Lyte");
        const tokenInput = new TextInputBuilder()
          .setCustomId("tokenInput")
          .setLabel("Discord Bot Token")
          .setRequired()
          .setStyle(TextInputStyle.Short);
        const clientInput = new TextInputBuilder()
          .setCustomId("clientInput")
          .setLabel("Bot's User ID")
          .setRequired()
          .setStyle(TextInputStyle.Short);
        const guildId = new TextInputBuilder()
          .setCustomId("guildId")
          .setLabel("Bot's Main Server ID")
          .setRequired()
          .setStyle(TextInputStyle.Short);

        const firstActionRow = new ActionRowBuilder().addComponents(tokenInput);
        const second = new ActionRowBuilder().addComponents(clientInput);
        const thrid = new ActionRowBuilder().addComponents(guildId);

        // Add inputs to the modal
        modal.addComponents(firstActionRow as any, second as any, thrid as any);
        await interaction.showModal(modal);

        // try {
        //     await BotModal.create({
        //         botOwnerId: interaction.user.id as string,

        //     })
        //   const SendConfirmationEmbedToUser = new EmbedBuilder()
        //     .setTitle("New Bot created on Lyte")
        //     .setDescription(
        //       `Hey there ${interaction.user.username}, \n\nWe've just wanted to let you know that there has been a bot created on your Discord account. You can manage your bot by running the Examply command. \n\nIf you have any questions about your bot, please feel free to reply to this message.`
        //     )
        //     .setColor("Green")
        //     .setFooter({
        //       text: "Don't recognize this activity? Reply to this message to contact support.",
        //     });
        //   interaction.user.send({ embeds: [SendConfirmationEmbedToUser] });
        //   await interaction.reply({
        //     content: `Successfully created your bot! Please make sure to store these credentials that are being sent to your DM's because these will be needed when contacting support. \n\nOn the behalf of Team Lyte, we'd like to thank you for choosing Lyte out of all competitors! It really does mean the world to us..`,
        //     components: [],
        //     ephemeral: true,
        //   });
        // } catch (e) {
        //   await interaction.editReply({
        //     content:
        //       "We've encountered an issue while executing this function, please contact anyone from Team Lyte.",
        //     components: [],
        //   });
        // }
      }
      if (interaction.customId === "manage-accounts") {
        const modal = new ModalBuilder()
          .setCustomId("account-modal")
          .setTitle("Manage an Discord user on Lyte.");
        const tokenInput = new TextInputBuilder()
          .setCustomId("userid-input")
          .setLabel("User's Discord ID")
          .setRequired()
          .setStyle(TextInputStyle.Short);

        const firstActionRow = new ActionRowBuilder().addComponents(tokenInput);
        const fetchBotsButton = new ButtonBuilder()
          .setCustomId("fetch-user-bots")
          .setLabel("Fetch User's Bots")
          .setStyle(ButtonStyle.Primary);

        const secondActionRow = new ActionRowBuilder().addComponents(
          fetchBotsButton
        );

        // Add inputs and button to the modal
        modal.addComponents(firstActionRow as any, secondActionRow as any);
        // Add inputs to the modal
        await interaction.showModal(modal);
      }
      if (interaction.customId === "manage-bot") {
        const modal = new ModalBuilder()
          .setCustomId("bot-modal")
          .setTitle("Manage a Discord bot on Lyte.");
        const tokenInput = new TextInputBuilder()
          .setCustomId("resourceId-admin")
          .setLabel("Bot's Resource ID")
          .setRequired()
          .setStyle(TextInputStyle.Short);

        const firstActionRow = new ActionRowBuilder().addComponents(tokenInput);

        // Add inputs to the modal
        modal.addComponents(firstActionRow as any);
        await interaction.showModal(modal);
      }
      const [action, target, type, userId] = interaction.customId.split("-");
      console.log(type);
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      if (type == "bot") {
        const bot = (await db.collection("bots").doc(userId).get()).data();
        if (target == "ban") {
          await db
            .collection("limitations")
            .doc(`${userId}-botcreation`)
            .create({
              reason: "Contact support for more information.",
              notes: "Banned VIA Discord Staff Panel. No Reason provided",
              author: interaction.user.username,
            });
          await interaction.reply({
            content:
              "🤖 Successfully banned " +
              `<@${userId}> from creating bots on Lyte.`,
          });
          return;
        }
        if (target == "unban") {
          const findSuspenstion = await db
            .collection("limitations")
            .doc(`${userId}-botcreation`)
            .get();

          if (findSuspenstion.exists) {
            await findSuspenstion.ref.delete().then(async () => {
              await interaction
                .reply({
                  content: `Successfully removed the bot creation ban from <@${userId}>.`,
                  ephemeral: true,
                })
                .then((msg) => {
                  setTimeout(() => {
                    msg.delete();
                  }, 3000);
                });
              return;
            });
          } else {
            await interaction
              .reply({
                content: "This user is not banned.",
                ephemeral: true,
              })
              .then((msg) => {
                setTimeout(() => {
                  msg.delete();
                }, 3000);
              });
          }
        }
        if (target == "restart") {
          await db
            .collection("bots")
            .doc(userId)
            .update({ region: "restarting" });
          await delay(5500);
          await db
            .collection("bots")
            .doc(userId)
            .update({ region: "us-west-1" });
        }
        if (target == "stop") {
          await db
            .collection("bots")
            .doc(userId)
            .update({ region: "stopped" })
            .then(async () => {
              const webHookClient = new WebhookClient({
                id: "1206641820319092777",
                token:
                  "xsoUBm8ls7znVoVEXT8CzmXB1URJhQuk9WzZzTLKAIZRwhOGv6mxgzlawOLjwJUu3wRl",
              });
              const embed = new EmbedBuilder()
                .setTitle("Staff Panel Action")
                .setAuthor({
                  name: interaction.user.username,
                  iconURL: interaction.user.avatarURL() as any,
                })
                .setThumbnail(interaction.user.avatarURL())
                .setDescription("New Action on Staff Panel Server")
                .setFields(
                  {
                    name: "Action Ran",
                    value: "Stop Bot",
                  },
                  {
                    name: "Bot Resource Id",
                    value: userId,
                  },

                  {
                    name: "Staff Tag",
                    value: `<@${interaction.user.id}>`,
                  },

                  {
                    name: "Timestamp",
                    value: `<t:${Date.now() / 1000}:F>`,
                  }
                )
                .setTimestamp();

              await webHookClient.send({
                embeds: [embed],
              });
            });
        }
        if (target == "start") {
          await db
            .collection("bots")
            .doc(userId)
            .update({ region: "us-west-1" })
            .then(async () => {
              const webHookClient = new WebhookClient({
                id: "1206641820319092777",
                token:
                  "xsoUBm8ls7znVoVEXT8CzmXB1URJhQuk9WzZzTLKAIZRwhOGv6mxgzlawOLjwJUu3wRl",
              });
              const embed = new EmbedBuilder()
                .setTitle("Staff Panel Action")
                .setAuthor({
                  name: interaction.user.username,
                  iconURL: interaction.user.avatarURL() as any,
                })
                .setThumbnail(interaction.user.avatarURL())
                .setDescription("New Action on Staff Panel Server")
                .setFields(
                  {
                    name: "Action Ran",
                    value: "Start Bot",
                  },
                  {
                    name: "Bot Resource Id",
                    value: userId,
                  },

                  {
                    name: "Staff Tag",
                    value: `<@${interaction.user.id}>`,
                  },

                  {
                    name: "Timestamp",
                    value: `<t:${Date.now() / 1000}:F>`,
                  }
                )
                .setTimestamp();

              await webHookClient.send({
                embeds: [embed],
              });
            });
        }
        if (target === "delete") {
          const webhook = new WebhookClient({
            id: "1206641820319092777",
            token:
              "xsoUBm8ls7znVoVEXT8CzmXB1URJhQuk9WzZzTLKAIZRwhOGv6mxgzlawOLjwJUu3wRl",
          });
          await db
            .collection("bots")
            .doc(userId)
            .delete()
            .then(async () => {
              const webHookClient = new WebhookClient({
                id: "1206641820319092777",
                token:
                  "xsoUBm8ls7znVoVEXT8CzmXB1URJhQuk9WzZzTLKAIZRwhOGv6mxgzlawOLjwJUu3wRl",
              });
              const embed = new EmbedBuilder()
                .setTitle("Staff Panel Action")
                .setAuthor({
                  name: interaction.user.username,
                  iconURL: interaction.user.avatarURL() as any,
                })
                .setThumbnail(interaction.user.avatarURL())
                .setDescription("New Action on Staff Panel Server")
                .setFields(
                  {
                    name: "Action Ran",
                    value: "**Delete Bot**",
                  },
                  {
                    name: "Bot Resource Id",
                    value: userId,
                  },

                  {
                    name: "Staff Tag",
                    value: `<@${interaction.user.id}>`,
                  },

                  {
                    name: "Timestamp",
                    value: `<t:${Date.now() / 1000}:F>`,
                  }
                )
                .setTimestamp();

              await webHookClient.send({
                content: "<@996916060806709379>",
                embeds: [embed],
              });
            })

            .catch((err) => {});
          return;
        }
      }
      if (type == "commands") {
        if (target == "ban") {
          await db
            .collection("limitations")
            .doc(`${userId}-commands`)
            .create({
              reason: "Contact support for more information.",
              notes: "Banned VIA Discord Staff Panel. No Reason provided",
              author: interaction.user.username,
            })
            .then(async () => {
              const webHookClient = new WebhookClient({
                id: "1206641820319092777",
                token:
                  "xsoUBm8ls7znVoVEXT8CzmXB1URJhQuk9WzZzTLKAIZRwhOGv6mxgzlawOLjwJUu3wRl",
              });
              const embed = new EmbedBuilder()
                .setTitle("Staff Panel Action")
                .setAuthor({
                  name: interaction.user.username,
                  iconURL: interaction.user.avatarURL() as any,
                })
                .setThumbnail(interaction.user.avatarURL())
                .setDescription("New Action on Staff Panel Server")
                .setFields(
                  {
                    name: "Action Ran",
                    value: "Commands Ban",
                  },
                  {
                    name: "User Id",
                    value: userId,
                  },
                  {
                    name: "User Tag",
                    value: `<@${userId}>`,
                  },
                  {
                    name: "Staff Tag",
                    value: `<@${interaction.user.id}>`,
                  },

                  {
                    name: "Timestamp",
                    value: `<t:${Date.now() / 1000}:F>`,
                  }
                )
                .setTimestamp();

              await webHookClient.send({
                content: "<@996916060806709379>",
                embeds: [embed],
              });
            });
          await interaction
            .reply({
              content:
                "🤖 Successfully banned " +
                `<@${userId}> from running commands on Lyte.`,
            })
            .then((msg) => {
              setTimeout(() => {
                msg.delete();
              }, 3000);
            });
          return;
        }
        if (target == "unban") {
          const findSuspenstion = await db
            .collection("limitations")
            .doc(`${userId}-commands`)
            .get();

          if (findSuspenstion.exists) {
            await findSuspenstion.ref.delete().then(async () => {
              await interaction
                .reply({
                  content: `Successfully removed the commands ban from <@${userId}>.`,
                  ephemeral: true,
                })
                .then((msg) => {
                  setTimeout(() => {
                    msg.delete();
                  }, 3000);
                  return;
                });
              const webHookClient = new WebhookClient({
                id: "1206641820319092777",
                token:
                  "xsoUBm8ls7znVoVEXT8CzmXB1URJhQuk9WzZzTLKAIZRwhOGv6mxgzlawOLjwJUu3wRl",
              });
              const embed = new EmbedBuilder()
                .setTitle("Staff Panel Action")
                .setAuthor({
                  name: interaction.user.username,
                  iconURL: interaction.user.avatarURL() as any,
                })
                .setThumbnail(interaction.user.avatarURL())
                .setDescription("New Action on Staff Panel Server")
                .setFields(
                  {
                    name: "Action Ran",
                    value: "**Delete Bot**",
                  },
                  {
                    name: "Bot Resource Id",
                    value: userId,
                  },

                  {
                    name: "Staff Tag",
                    value: `<@${interaction.user.id}>`,
                  },

                  {
                    name: "Timestamp",
                    value: `<t:${Date.now() / 1000}:F>`,
                  }
                )
                .setTimestamp();

              await webHookClient.send({
                content: "<@996916060806709379>",
                embeds: [embed],
              });
            });
          } else {
            await interaction
              .reply({
                content: "This user is not banned.",
                ephemeral: true,
              })
              .then((msg) => {
                setTimeout(() => {
                  msg.delete();
                }, 3000);
              });
          }
        }
      }
      if (type == "web") {
        if (target == "ban") {
          await db
            .collection("limitations")
            .doc(`${userId}-web`)
            .create({
              reason: "Contact support for more information.",
              notes: "Banned VIA Discord Staff Panel. No Reason provided",
              author: interaction.user.username,
            })
            .then(async () => {
              const webHookClient = new WebhookClient({
                id: "1206641820319092777",
                token:
                  "xsoUBm8ls7znVoVEXT8CzmXB1URJhQuk9WzZzTLKAIZRwhOGv6mxgzlawOLjwJUu3wRl",
              });
              const embed = new EmbedBuilder()
                .setTitle("Staff Panel Action")
                .setAuthor({
                  name: interaction.user.username,
                  iconURL: interaction.user.avatarURL() as any,
                })
                .setThumbnail(interaction.user.avatarURL())
                .setDescription("New Action on Staff Panel Server")
                .setFields(
                  {
                    name: "Action Ran",
                    value: "Website Ban",
                  },
                  {
                    name: "User Id",
                    value: userId,
                  },

                  {
                    name: "Staff Tag",
                    value: `<@${interaction.user.id}>`,
                  },
                  {
                    name: "User Tag",
                    value: `<@${userId}>`,
                  },

                  {
                    name: "Timestamp",
                    value: `<t:${Date.now() / 1000}:F>`,
                  }
                )
                .setTimestamp();

              await webHookClient.send({
                content: "<@996916060806709379>",
                embeds: [embed],
              });
            });
          await interaction
            .reply({
              content:
                "🤖 Successfully banned " + `<@${userId}> from the website.`,
            })
            .then((msg) => {
              setTimeout(() => {
                msg.delete();
              }, 3000);
            });
          return;
        }
        if (target == "unban") {
          const findSuspenstion = await db
            .collection("limitations")
            .doc(`${userId}-web`)
            .get();

          if (findSuspenstion.exists) {
            await findSuspenstion.ref.delete().then(async () => {
              const webHookClient = new WebhookClient({
                id: "1206641820319092777",
                token:
                  "xsoUBm8ls7znVoVEXT8CzmXB1URJhQuk9WzZzTLKAIZRwhOGv6mxgzlawOLjwJUu3wRl",
              });
              const embed = new EmbedBuilder()
                .setTitle("Staff Panel Action")
                .setAuthor({
                  name: interaction.user.username,
                  iconURL: interaction.user.avatarURL() as any,
                })
                .setThumbnail(interaction.user.avatarURL())
                .setDescription("New Action on Staff Panel Server")
                .setFields(
                  {
                    name: "Action Ran",
                    value: "Website Unban",
                  },
                  {
                    name: "User Id",
                    value: userId,
                  },

                  {
                    name: "Staff Tag",
                    value: `<@${interaction.user.id}>`,
                  },
                  {
                    name: "User Tag",
                    value: `<@${userId}>`,
                  },

                  {
                    name: "Timestamp",
                    value: `<t:${Date.now() / 1000}:F>`,
                  }
                )
                .setTimestamp();

              await webHookClient.send({
                content: "<@996916060806709379>",
                embeds: [embed],
              });
              await interaction
                .reply({
                  content: `Successfully removed the website ban from <@${userId}>.`,
                  ephemeral: true,
                })
                .then((msg) => {
                  setTimeout(() => {
                    msg.delete();
                  }, 3000);
                });
              return;
            });
          } else {
            await interaction
              .reply({
                content: "This user is not banned.",
                ephemeral: true,
              })
              .then((msg) => {
                setTimeout(() => {
                  msg.delete();
                }, 3000);
              });
          }
        }
      }
    } else if (interaction.isStringSelectMenu()) {
      const [target, type, resourceId] = interaction.customId.split("-");
      await db
        .collection("bots")
        .doc(resourceId)
        .update({
          region: interaction.values[0],
        })
        .then(async () => {
          await interaction
            .reply({
              content: `Successfully changed bot's region to ${interaction.values[0]}.`,
              ephemeral: true,
            })
            .then((msg) => {
              setTimeout(async () => {
                await msg.delete();
              }, 3000);
            });
          return;
        });
    }
  },
};

export default event;
