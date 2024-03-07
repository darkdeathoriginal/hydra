const { Module, onButton } = require("../index");
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
  PermissionFlagsBits,
} = require("discord.js");
const { buildDb, buildItemsDb } = require("./sql/build");

Module(
  {
    name: "build",
    description: "Minecraft build item request",
    options: [
      {
        name: "name",
        description: "build name",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "url",
        description: "video url",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },
  async (m) => {
    const name = m.options.getString("name");
    const url = m.options.getString("url") || "";
    const channelId = m.channel.id;
    const modal = new ModalBuilder()
      .setTitle("Create build request")
      .setCustomId(`build-${m.user.id}`);
    const textInput = new TextInputBuilder()
      .setCustomId("build-input")
      .setLabel("Enter items and use ',' to separate them")
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(1000)
      .setRequired(true);

    const actionRow = new ActionRowBuilder().addComponents(textInput);
    modal.addComponents(actionRow);
    await m.showModal(modal);

    const filter = (i) => i.customId == `build-${m.user.id}`;

    const modalInteraction = await m
      .awaitModalSubmit({
        filter,
        time: 60 * 1000,
      })
      .catch((e) => console.log(e));

    await modalInteraction.deferReply({ ephemeral: true });
    let buildMessage;
    try {
      buildMessage = await m.channel.send("creating build request");
    } catch (e) {
      console.log(e);
      modalInteraction.editReply("failed to create build request");
      return;
    }
    const buildText = modalInteraction.fields.getTextInputValue("build-input");
    await buildDb.sync({ alter: true });
    await buildItemsDb.sync();
    const newBuild = await buildDb.create({
      name,
      userId: m.user.id,
      channelId,
      message: buildMessage.id,
    });
    const buildEmbed = new EmbedBuilder()
      .setAuthor({
        name: m.user.username,
        iconURL: m.user.displayAvatarURL({ size: 256 }),
      })
      .addFields([
        {
          name: "Buid",
          value: name,
        },
      ])
      .setColor("Yellow");
    try {
      if (url) {
        buildEmbed.setURL(url).addFields([
          {
            name: "Video",
            value: `[click here](${url})`,
          },
        ]);
      }
    } catch (error) {
      return await buildMessage.edit({
        content: "failed to create build request\nInvalid url",
      });
    }
    buildEmbed.addFields([
      {
        name: "Status",
        value: "Pending",
      },
      {
        name: "Progress",
        value: "0%",
      },
    ]);
    const btnArray = [];
    const items = buildText.split(",");
    if (items.length > 25) {
      return await buildMessage.edit({
        content: "failed to create build request\nToo many items",
      });
    }
    for (let item of items) {
      if (!item.trim()) continue;
      const newItem = await buildItemsDb.create({
        buildId: newBuild.id,
        item,
      });
      const Btn = new ButtonBuilder()
        .setEmoji("⬜")
        .setLabel(item)
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`build-${newItem.id}`);
      btnArray.push(Btn);
    }
    const rows = [];
    for (let i = 0; i < btnArray.length; i += 5) {
      const row = new ActionRowBuilder().addComponents(
        btnArray.slice(i, i + 5)
      );
      rows.push(row);
    }

    buildMessage.edit({
      content: `${m.user} suggestion created`,
      embeds: [buildEmbed],
      components: rows,
    });
  }
);
onButton(
  {
    name: "build",
  },
  async (m) => {
    try {
      const itemId = m.customId.split("build-")[1];
      await m.deferReply({ ephemeral: true });
      await buildItemsDb.sync();
      const item = await buildItemsDb.findOne({ where: { id: itemId } });
      if (!item) {
        return await m.editReply("item not found");
      }
      const build = await buildDb.findOne({ where: { id: item.buildId } });
      if (item.status == "pending") {
        item.status = "completed";
        await item.save();
        const buildItems = await buildItemsDb.findAll({
          where: { buildId: build.id },
        });
        const completedItems = buildItems.filter(
          (i) => i.status == "completed"
        );
        const progress = (completedItems.length / buildItems.length) * 100;
        const buildMessage = await m.channel.messages.fetch(build.message);
        const buildEmbed = buildMessage.embeds[0];
        const fieldLength = buildEmbed.fields.length;
        buildEmbed.fields[fieldLength>3?3:2].value = `${progress.toFixed(0)}%`;
        if (progress == 100) {
          buildEmbed.data.color = 0x84e660;
          buildEmbed.fields[fieldLength>2?2:1].value = "Completed";
          build.status = "completed";
          await build.save();
        }
        const button = [];
        for (let item of buildItems) {
          const Btn = new ButtonBuilder()
            .setEmoji(item.status == "completed" ? "✅" : "⬜")
            .setLabel(item.item)
            .setStyle(
              item.status == "completed"
                ? ButtonStyle.Success
                : ButtonStyle.Secondary
            )
            .setCustomId(`build-${item.id}`);
          button.push(Btn);
        }
        const rows = [];
        for (let i = 0; i < button.length; i += 5) {
          const row = new ActionRowBuilder().addComponents(
            button.slice(i, i + 5)
          );
          rows.push(row);
        }
        buildMessage.edit({
          embeds: [buildEmbed],
          components: rows,
        });
        return await m.editReply("item completed");
      }
      if (item.status == "completed") {
        item.status = "pending";
        await item.save();
        const buildItems = await buildItemsDb.findAll({
          where: { buildId: build.id },
        });
        const completedItems = buildItems.filter(
          (i) => i.status == "completed"
        );
        const progress = (completedItems.length / buildItems.length) * 100;
        const buildMessage = await m.channel.messages.fetch(build.message);
        const buildEmbed = buildMessage.embeds[0];
        const fieldLength = buildEmbed.fields.length;
        buildEmbed.fields[fieldLength>3?3:2].value = `${progress.toFixed(0)}%`;
        if (progress != 100) {
          buildEmbed.data.color = 0xffd700;
          buildEmbed.fields[fieldLength>2?2:1].value = "Pending";
          build.status = "pending";
          await build.save();
        }
        const button = [];
        for (let item of buildItems) {
          const Btn = new ButtonBuilder()
            .setEmoji(item.status == "completed" ? "✅" : "⬜")
            .setLabel(item.item)
            .setStyle(
              item.status == "completed"
                ? ButtonStyle.Success
                : ButtonStyle.Secondary
            )
            .setCustomId(`build-${item.id}`);
          button.push(Btn);
        }
        const rows = [];
        for (let i = 0; i < button.length; i += 5) {
          const row = new ActionRowBuilder().addComponents(
            button.slice(i, i + 5)
          );
          rows.push(row);
        }
        buildMessage.edit({
          embeds: [buildEmbed],
          components: rows,
        });
        return await m.editReply("item uncompleted");
      }
    } catch (e) {
      console.log(e);
      return await m.editReply("failed to complete item");
    }
  }
);
