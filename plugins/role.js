const { Module, onButton } = require("../index");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");

const roles = {};

Module(
  {
    name: "role-generator",
    description: "adds a role",
    options: [
      {
        name: "add",
        description: "To add roles",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "role",
            description: "The role you want users to get on join.",
            type: ApplicationCommandOptionType.Role,
            required: true,
          },
          {
            name: "emoji",
            description: "Emoji you want to set for this role.",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "generate",
        description: "generate Role message",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
    dm_permission: false,
    default_member_permissions: PermissionFlagsBits.ManageRoles.toString(),
  },
  async (m) => {
    const subcommand = m.options.getSubcommand();
    if (subcommand == "add") {
      roles[m.guildId] = roles[m.guildId] ? roles[m.guildId] : [];
      const role = m.options.getRole("role");
      const emoji = m.options.getString("emoji");
      roles[m.guildId].push({ role, emoji });
      let e1 = new EmbedBuilder()
        .setColor(role.color)
        .setDescription(`role added.`);
      return await m.reply({ embeds: [e1], ephemeral: true });
    }
    if (!roles[m.guildId]) {
      return m.reply({
        content:
          "no roles have been added. Use `/role-generator` add to add roles",
        ephemeral: true,
      });
    }
    let row = new ActionRowBuilder().addComponents(
      roles[m.guildId].map((e) => {
        return new ButtonBuilder()
          .setLabel(`${e.role.name}`)
          .setStyle(ButtonStyle.Primary)
          .setCustomId(`role-${e.role.id}`)
          .setEmoji(e.emoji);
      })
    );
    delete roles[m.guildId];
    return await m.reply({
      content: "Press the buttons to give yourself a role",
      components: [row],
    });
  }
);

onButton(
  {
    name: "role",
  },
  async (m) => {
    try {
      await m.deferUpdate();
      let id = m.customId;
      let role = id.split("role-")[1];
      role = m.guild.roles.cache.get(role);
      if (role) {
        if (m.member.roles.cache.has(role.id)) {
          await m.member.roles.remove(role.id);
          let e1 = new EmbedBuilder()
            .setColor(role.color)
            .setDescription(`${role.name} role has been removed for you.`);
          return await m.followUp({ embeds: [e1], ephemeral: true });
        }
        await m.member.roles.add(role.id);
        let e1 = new EmbedBuilder()
          .setColor(role.color)
          .setDescription(`${role.name} role has been added to you.`);
        return await m.followUp({ embeds: [e1], ephemeral: true });
      }
    } catch (e) {
      console.log(e);
      let e1 = new EmbedBuilder().setDescription(`an error occured.`);
      return await m.followUp({ embeds: [e1], ephemeral: true });
    }
  }
);
