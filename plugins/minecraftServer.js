const { Module, onButton, onReady } = require("../index");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ApplicationCommandOptionType,
  ChannelType,
  PermissionFlagsBits,
} = require("discord.js");
const net = require("net");
const { minecraftServerDb } = require("./sql/minecraftServer");

Module(
  {
    name: "server",
    description: "Minecraft server status.",
    options: [
      {
        name: "url",
        description: "Server url.",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "port",
        description: "discord channel id",
        type: ApplicationCommandOptionType.Integer,
        required: false,
      },
    ],
  },
  async (m) => {
    if (!m.guildId) return await m.reply("this is a guild command");
    const url = m.options.getString("url");
    const port = m.options.getInteger("Port") || 25565;
    await m.deferReply({ ephemeral: true });
    const guild = await m.client.guilds.fetch(m.guildId);
    let details;
    try {
      details = await queryServer(url, port);
    } catch (error) {
      return await m.editReply(
        "Invalid server address or port or server is offline."
      );
    }
    try {
      let catogory = await guild.channels.create({
        name: "📊Server Status📊",
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: m.guild.id,
            deny: [],
          },
        ],
        position: 0,
      });
      const playerchannel = await guild.channels.create({
        name: details.online,
        type: ChannelType.GuildVoice,
        parent: catogory.id,
        permissionOverwrites: [
          {
            id: m.guild.id,
            deny: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
            ],
          },
          {
            id: m.client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
            ],
          },
        ],
      });
      const maxchannel = await guild.channels.create({
        name: details.max,
        type: ChannelType.GuildVoice,
        parent: catogory.id,
        permissionOverwrites: [
          {
            id: m.guild.id,
            deny: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
            ],
          },
          {
            id: m.client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
            ],
          },
        ],
      });
      const versionchannel = await guild.channels.create({
        name: details.version,
        type: ChannelType.GuildVoice,
        parent: catogory.id,
        permissionOverwrites: [
          {
            id: m.guild.id,
            deny: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
            ],
          },
          {
            id: m.client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
            ],
          },
        ],
      });
      const statusChannel = await guild.channels.create({
        name: "Status: " + "Online",
        type: ChannelType.GuildVoice,
        parent: catogory.id,
        permissionOverwrites: [
          {
            id: m.guild.id,
            deny: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
            ],
          },
          {
            id: m.client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
            ],
          },
        ],
      });
      await minecraftServerDb.sync();
      await minecraftServerDb.create({
        url: url,
        port: port,
        guildId: m.guildId,
        currentChannel: playerchannel.id,
        maxChannel: maxchannel.id,
        versionChannel: versionchannel.id,
        statusChannel: statusChannel.id,
      });
      return await m.editReply("Server status added.");
    } catch (error) {
      console.log(error);
      return await m.editReply(error.message);
    }
  }
);

onReady(
  {
    name: "mnserver",
  },
  async (client) => {
    await minecraftServerDb.sync();
    while (true) {
      try {
        const servers = await minecraftServerDb.findAll();
        for (let server of servers) {
          const guild = await client.guilds.cache.get(server.guildId);
          const playerchannel = guild.channels.cache.get(server.currentChannel);
          const maxchannel = guild.channels.cache.get(server.maxChannel);
          const versionchannel = guild.channels.cache.get(
            server.versionChannel
          );
          const statusChannel = guild.channels.cache.get(server.statusChannel);
          try {
            const details = await queryServer(server.url, server.port);
            if (playerchannel.name !== details.online) {
              playerchannel.setName(details.online);
            }
            if (maxchannel.name !== details.max) {
              maxchannel.setName(details.max);
            }
            if (versionchannel.name !== details.version) {
              versionchannel.setName(details.version);
            }
            if (statusChannel.name !== "Status: " + "Online") {
              statusChannel.setName("Status: " + "Online");
            }
          } catch (error) {
            if (statusChannel.name !== "Status: " + "Offline") {
              statusChannel.setName("Status: " + "Offline");
            }
          }
        }
      } catch (error) {
        console.log(error);
      } finally {
        await new Promise((resolve) => setTimeout(resolve, 30000));
      }
    }
  }
);

const queryServer = (serverAddress, serverPort) => {
  const client = new net.Socket();
  return new Promise((resolve, reject) => {
    client.on("error", (err) => {
      console.error("Error:", err.message);
      reject(err.message);
    });

    client.connect(serverPort, serverAddress, () => {
      const handshake = Buffer.from([0xfe, 0x01]);
      client.write(handshake);
    });

    client.on("data", (data) => {
      if (data[0] !== 0xff) {
        console.error("Invalid data received from server.");
        reject("Invalid data received from server.");
      }

      const serverInfo = data.toString("utf8").split("\x00\x00\x00");
      if (serverInfo.length < 6) {
        console.error("Invalid server information received.");
        reject("Invalid server information received.");
      }
      resolve({
        online: "Online players: " + serverInfo[4],
        max: "Max players: " + serverInfo[5],
        version: "Version: " + serverInfo[2],
      });
    });
  });
};
