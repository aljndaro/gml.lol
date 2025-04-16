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
    } if (interaction.isButton()) {
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

            .catch((err) => { });
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
