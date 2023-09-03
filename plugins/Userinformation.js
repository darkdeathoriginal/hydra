const { ApplicationCommandType } = require("discord.js");
const { onCMenu } = require("..");

onCMenu(
  {
    name: "User information",
    type: ApplicationCommandType.User,
  },
  async (m) => {
    const user = m.targetUser;
    return await m.reply({
      content: `Name : ${user.username}\nId : ${
        user.id
      }\nProfile pic : ${user.displayAvatarURL()}`,
      ephemeral: true,
    });
  }
);
