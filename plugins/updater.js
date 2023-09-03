const { ApplicationCommandOptionType } = require("discord.js");
const { Module } = require("..");
const simpleGit = require("simple-git");
const git = simpleGit();

Module(
  {
    name: "update",
    description: "Bot updater",
    owner: true,
    options: [
      {
        name: "start",
        description: "Start the update",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "view",
        description: "View pending updates",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },
  async (m) => {
    await git.fetch();
    const subcommand = m.options.getSubcommand();
    var commits = await git.log(["main" + "..origin/" + "main"]);
    var msg = "";
    if (commits.total === 0) {
      msg = "*Bot up to date!*";
      return await m.reply(msg);
    } else if (subcommand == "start") {
      await require("simple-git")().reset("hard", ["HEAD"]);
      await require("simple-git")().pull();
      await m.reply(
        "Successfully updated. Please manually update npm modules if applicable!"
      );
      process.exit(0);
    } else {
      var changelog = "Pending updates:\n\n";
      for (var i in commits.all) {
        changelog += `${parseInt(i) + 1}• *${commits.all[i].message}*\n`;
      }
      changelog += `\nUse "/update start" to start the update`;
      return await m.reply(changelog);
    }
  }
);
