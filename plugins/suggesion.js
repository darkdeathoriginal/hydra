const { Module, onButton } = require("../index");
const { gcfDb, addgcf, updategcf } = require("./sql/GuildConfiguration");
const { suggestion } = require("./sql/suggestion");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
  ApplicationCommandOptionType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

Module(
  {
    name: "config-suggestion",
    description: "configure suggestion",
    dm_permission: false,
    options: [
      {
        name: "add",
        description: "Add a suggestion channel",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel",
            description: "channel you want to add",
            required: true,
            type: ApplicationCommandOptionType.Channel,
            channel_types: [ChannelType.GuildText],
          },
        ],
      },
      {
        name: "remove",
        description: "Remove a suggestion channel",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel",
            description: "channel you want to remove",
            required: true,
            type: ApplicationCommandOptionType.Channel,
            channel_types: [ChannelType.GuildText],
          },
        ],
      },
    ],
  },

  async (m) => {
    let guildconf = await findDb(m.guildId);
    if (!guildconf) {
      await gcfDb.sync();
      guildconf = await addgcf(m.guildId);
    }
    const subcommand = m.options.getSubcommand();
    if (subcommand == "add") {
      const channel = m.options.getChannel("channel");
      let arr = guildconf.channels;
      if (arr.includes(channel.id)) {
        return await m.reply(`${channel} is already a suggestion channel`);
      }
      arr.push(channel.id);
      await updategcf(m.guildId, arr);
      return await m.reply(`${channel} added to suggestion channels.`);
    }
    if (subcommand == "remove") {
      const channel = m.options.getChannel("channel");
      if (!guildconf.channels.includes(channel.id)) {
        return await m.reply(`${channel} is not a suggestion channel`);
      }
      guildconf.channels = guildconf.channels.filter((e) => {
        e != channel.id;
      });
      await guildconf.save();
      return await m.reply(`${channel} removed form suggestion`);
    }
  }
);

async function findDb(id) {
  try {
    return await gcfDb.findOne({
      where: { guildId: id },
    });
  } catch (e) {
    return false;
  }
}

Module(
  {
    name: "suggest",
    description: "create a suggestion",
    dm_permission: false,
  },
  async (m) => {
    await gcfDb.sync();
    let guildconf = await gcfDb.findOne({ where: { guildId: m.guildId } });
    if (!guildconf?.channels.length) {
      return await m.reply(
        "Suggestion hasn not been set, contact moderator to enable suggestion"
      );
    }
    if (!guildconf.channels.includes(m.channelId)) {
      return await m.reply("This channel is not configured to use suggestion");
    }

    const modal = new ModalBuilder()
      .setTitle("Create suggestion")
      .setCustomId(`suggestion-${m.user.id}`);
    const textInput = new TextInputBuilder()
      .setCustomId("suggestion-input")
      .setLabel("what would you like to suggest")
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(1000)
      .setRequired(true);

    const actionRow = new ActionRowBuilder().addComponents(textInput);
    modal.addComponents(actionRow);
    await m.showModal(modal);

    const filter = (i) => i.customId == `suggestion-${m.user.id}`;

    const modalInteraction = await m
      .awaitModalSubmit({
        filter,
        time: 60 * 1000,
      })
      .catch((e) => console.log(e));

    await modalInteraction.deferReply({ ephemeral: true });

    let suggestMessage;
    try {
      suggestMessage = await m.channel.send("creating suggestion");
    } catch (e) {
      console.log(e);
      modalInteraction.editReply("failed to create suggestion message");
      return;
    }

    const suggestionText =
      modalInteraction.fields.getTextInputValue("suggestion-input");
    await suggestion.sync();
    const newsuggestion = await suggestion.create({
      authorId: m.user.id,
      guildId: m.guild.id,
      messageId: suggestMessage.id,
      content: suggestionText,
    });
    await newsuggestion.save();
    await modalInteraction.editReply("suggestion was created");

    const suggestionEmbed = new EmbedBuilder()
      .setAuthor({
        name: m.user.username,
        iconURL: m.user.displayAvatarURL({ size: 256 }),
      })
      .addFields([
        {
          name: "suggestion",
          value: suggestionText,
        },
        {
          name: "status",
          value: "Pending",
        },
        { name: "votes", value: formatResults() },
      ])
      .setColor("Yellow");

    const upvoteBtn = new ButtonBuilder()
      .setEmoji("👍")
      .setLabel("Upvote")
      .setStyle(ButtonStyle.Primary)
      .setCustomId(`suggest-${newsuggestion.suggestionId}.upvote`);

    const downvoteBtn = new ButtonBuilder()
      .setEmoji("👎")
      .setLabel("downVote")
      .setStyle(ButtonStyle.Primary)
      .setCustomId(`suggest-${newsuggestion.suggestionId}.downvote`);

    const approveBtn = new ButtonBuilder()
      .setEmoji("✅")
      .setLabel("Approve")
      .setStyle(ButtonStyle.Success)
      .setCustomId(`suggest-${newsuggestion.suggestionId}.approve`);
    const rejectBtn = new ButtonBuilder()
      .setEmoji("❌")
      .setLabel("Reject")
      .setStyle(ButtonStyle.Danger)
      .setCustomId(`suggest-${newsuggestion.suggestionId}.reject`);

    const firstRow = new ActionRowBuilder().addComponents(
      upvoteBtn,
      downvoteBtn
    );
    const secondRow = new ActionRowBuilder().addComponents(
      approveBtn,
      rejectBtn
    );

    suggestMessage.edit({
      content: `${m.user} suggestion created`,
      embeds: [suggestionEmbed],
      components: [firstRow, secondRow],
    });
  }
);

onButton(
  {
    name: "suggest",
  },
  async (m) => {
    try {
      const [suggestionId, action] = m.customId.split("suggest-")[1].split(".");

      await m.deferReply({ ephemeral: true });

      //   const targetsuggestion = await suggestion.findOne({
      //     where: { suggestionId },
      //   });
      const targetsuggestion = (await suggestion.findAll()).find(
        (e) => e.suggestionId == suggestionId
      );
      const targetMessage = await m.channel.messages.fetch(
        targetsuggestion.messageId
      );
      const targetMessageEmbed = targetMessage.embeds[0];

      if (action == "approve") {
        if (!m.memberPermissions.has("Administrator")) {
          return await m.editReply("you dont have permision");
        }
        targetsuggestion.status = "approved";

        targetMessageEmbed.data.color = 0x84e660;
        targetMessageEmbed.fields[1].value = "Aproved";

        await targetsuggestion.save();

        await m.editReply("suggestion approved");
        return await targetMessage.edit({
          embeds: [targetMessageEmbed],
          components: [targetMessage.components[0]],
        });
      }
      if (action == "reject") {
        if (!m.memberPermissions.has("Administrator")) {
          return await m.editReply("you dont have permision");
        }
        targetsuggestion.status = "rejected";

        targetMessageEmbed.data.color = 0xff6161;
        targetMessageEmbed.fields[1].value = "rejected";

        await targetsuggestion.save();
        await m.editReply("suggestion rejected");
        return await targetMessage.edit({
          embeds: [targetMessageEmbed],
          components: [targetMessage.components[0]],
        });
      }
      if (action == "upvote") {
        const hasVotes =
          targetsuggestion.upvotes.includes(m.user.id) ||
          targetsuggestion.downvotes.includes(m.user.id);
        if (hasVotes) {
          return await m.editReply("You have already voted");
        }
        targetsuggestion.upvotes = [...targetsuggestion.upvotes, m.user.id];

        await targetsuggestion.save();

        m.editReply("Upvoted sugggestion");
        targetMessageEmbed.fields[2].value = formatResults(
          targetsuggestion.upvotes,
          targetsuggestion.downvotes
        );

        return await targetMessage.edit({
          embeds: [targetMessageEmbed],
        });
      }
      if (action == "downvote") {
        console.log(targetsuggestion);
        const hasVotes =
          targetsuggestion.upvotes.includes(m.user.id) ||
          targetsuggestion.downvotes.includes(m.user.id);
        if (hasVotes) {
          return await m.editReply("You have already voted");
        }
        targetsuggestion.downvotes = [...targetsuggestion.downvotes, m.user.id];

        await targetsuggestion.save();

        m.editReply("downvoted sugggestion");
        targetMessageEmbed.fields[2].value = formatResults(
          targetsuggestion.upvotes,
          targetsuggestion.downvotes
        );

        return await targetMessage.edit({
          embeds: [targetMessageEmbed],
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
);

function formatResults(upvotes = [], downvotes = []) {
  const totalVotes = upvotes.length + downvotes.length;
  const progressBarLength = 14;
  const filledSquares =
    Math.round((upvotes.length / totalVotes) * progressBarLength) || 0;
  const emptySquares = progressBarLength - filledSquares || 0;

  if (!filledSquares && !emptySquares) {
    emptySquares = progressBarLength;
  }

  const upPercentage = (upvotes.length / totalVotes) * 100 || 0;
  const downPercentage = (downvotes.length / totalVotes) * 100 || 0;

  const results = [];
  results.push(
    `👍 ${upvotes.length} upvotes (${upPercentage.toFixed(1)}%) • 👎 ${
      downvotes.length
    } downvotes (${downPercentage.toFixed(1)}%)`
  );

  return results.join("\n");
}
