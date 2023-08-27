const { Client, GatewayIntentBits,REST, Routes } = require('discord.js');
require('dotenv').config();
const {CLIENT_ID,TOKEN} = require("./config")
const fs = require("fs");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const rest = new REST({ version: '10' }).setToken(TOKEN);

const commands = [];
const buttons = [];
const readyList = []

function Module(object,callback){
    object.callback = callback
    commands.push(object)
}
function onButton(object,callback){
    object.callback = callback
    buttons.push(object)
}
function onReady(object,callback){
    object.callback = callback
    readyList.push(object)
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
        for(let i of readyList){
            i.callback(client)
        }

    });

    client.on('interactionCreate', async interaction => {
    try{

        if(interaction.isChatInputCommand()){
            for(let i of commands){
                if(i.name == interaction.commandName){
                    i.callback(interaction)
                }
            }
        }
        else if(interaction.isButton()){
            for(let i of buttons){
                if(interaction.customId?.startsWith(i.name)){
                    i.callback(interaction)
                }
            }
        }
        else{
            return ;
        }
    }
    catch(e){
        console.log(e);
    }
    });

    client.login(TOKEN);
}
module.exports = {
    Module,
    onButton,
    onReady
}
connect()
