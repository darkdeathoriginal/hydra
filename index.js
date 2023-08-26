const { Client, GatewayIntentBits,REST, Routes } = require('discord.js');
require('dotenv').config();
const {CLIENT_ID,TOKEN} = require("./config")
const fs = require("fs");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const rest = new REST({ version: '10' }).setToken(TOKEN);

const commands = [];
function Module(object,callback){
    object.callback = callback
    commands.push(object)
}
async function connect(){

    const pluginFolder = "./plugins/";
    const files = fs.readdirSync(pluginFolder);

    files.forEach((file) => {
        if (file.endsWith('.js')) {
        const filePath = pluginFolder+file;
        require(filePath);
        }
    });

    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
  
  
    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
    });

    client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    for(let i of commands){
        if(i.name == interaction.commandName){
            i.callback(interaction)
        }
    }
    });

    client.login(TOKEN);
}
module.exports = {
    Module
}
connect()
