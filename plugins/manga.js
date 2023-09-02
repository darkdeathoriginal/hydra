const { Module, onSelect, onButton } = require("../index");
const { getManga, getChapter, getBuffer } = require("./lib/manga");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ApplicationCommandOptionType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
} = require("discord.js");

const MORE = {};

Module(
  {
    name: "manga",
    description: "manga downloader",
    options: [
      {
        name: "query",
        description: "manga you want",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
  async (m) => {
    const query = m.options.getString("query");
    const url = "https://ww5.manganelo.tv/search/" + query;

    let article = await getManga(url);
    if (article.length == 0) {
      return await m.reply({
        content: "manga not found",
        ephemeral: true,
      });
    }
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(m.id)
      .setPlaceholder("Select the manga..")
      .setMaxValues(1)
      .addOptions(
        article.map((e) =>
          new StringSelectMenuOptionBuilder().setLabel(e.title.slice(0,100)).setValue(e.lin)
        )
      );
    const actionRow = new ActionRowBuilder().addComponents(selectMenu);
    const reply = await m.reply({
      components: [actionRow],
      ephemeral: true,
    });
    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: (i) => i.user.id == m.user.id && i.customId == m.id,
      time: 60 * 1000,
    });
    collector.on("collect", async (m) => {
      const link = m.values[0];
      let array = await getChapter(link);
      let newArray;
      let nextBtn;
      if (array.length > 25) {
        newArray = array.slice(0, 25);
        MORE[m.user.id] = array;
        nextBtn = new ButtonBuilder()
          .setLabel(`Next page`)
          .setStyle(ButtonStyle.Primary)
          .setCustomId(`manganext-1`);
      } else {
        newArray = array;
      }
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("mangalist")
        .setPlaceholder("Select the chapter..")
        .setMaxValues(1)
        .addOptions(
          newArray.map((e) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(e.title)
              .setValue(e.lin)
          )
        );
      const actionRow = new ActionRowBuilder().addComponents(selectMenu);
      const row = [actionRow];
      if (newArray != array) {
        row.push(new ActionRowBuilder().addComponents(nextBtn));
      }
      await m.deferUpdate();

      await reply.edit({
        components: row,
        ephemeral: true,
      });
    });
  }
);

onSelect(
  {
    name: "mangalist",
  },
  async (m) => {
    await m.deferReply({ ephemeral: true });
    const url = m.values[0];
    const title = url.split("/").at(-1);
    const pdfData = await getBuffer(url, `${title}.pdf`);
    await m.editReply({
      files: [
        {
          attachment: pdfData,
          name: `${title}.pdf`,
        },
      ],
    });
  }
);

onButton(
  {
    name: "manganext",
  },
  async (m) => {
    let id = m.customId;
    const user = m.user.id;
    const chapters = MORE[user];
    const reply = REPLIES[user];
    const n = Number(id.split("-")[1]);
    const array = chapters.slice(n * 25, chapters.length - 1);
    let newArray;
    let nextBtn;
    if (array.length > 25) {
      newArray = array.slice(0, 25);
      nextBtn = new ButtonBuilder()
        .setLabel(`Next page`)
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`manganext-${n + 1}`);
    } else {
      newArray = array;
    }
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("mangalist")
      .setPlaceholder("Select the chapter..")
      .setMaxValues(1)
      .addOptions(
        newArray.map((e) =>
          new StringSelectMenuOptionBuilder().setLabel(e.title).setValue(e.lin)
        )
      );
    const actionRow = new ActionRowBuilder().addComponents(selectMenu);
    const row = [actionRow];
    if (newArray != array) {
      if (n != 0) {
        const prevBtn = new ButtonBuilder()
          .setLabel(`Previous page`)
          .setStyle(ButtonStyle.Primary)
          .setCustomId(`manganext-${n - 1}`);
        row.push(new ActionRowBuilder().addComponents([prevBtn, nextBtn]));
      } else {
        row.push(new ActionRowBuilder().addComponents(nextBtn));
      }
    }

    await m.update({
      components: row,
      ephemeral: true,
    });
  }
);
