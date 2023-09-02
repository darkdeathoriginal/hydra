const { Client, GatewayIntentBits,REST, Routes } = require('discord.js');
require('dotenv').config();
const {CLIENT_ID,TOKEN} = require("./config")
const fs = require("fs");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const rest = new REST({ version: '10' }).setToken(TOKEN);

const commands = {};
const buttons = {};
const readyList = []
const selectList = {}

function Module(object,callback){
    object.callback = callback
    commands[object.name] = object
}
function onButton(object,callback){
    object.callback = callback
    buttons[object.name] = object
}
function onReady(object,callback){
    object.callback = callback
    readyList.push(object)
}
function onSelect(object,callback){
    object.callback = callback
    selectList[object.name] = object
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
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: Object.values(commands) });
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
            let command = commands[interaction.commandName]
            if(command){
                command.callback(interaction)
            }
        }
        else if(interaction.isButton()){
            let id = interaction.customId.split("-")[0]
            let button = buttons[id]
            if(button){
                button.callback(interaction)
            }
        }
        else if(interaction.isAnySelectMenu()){
            let id = interaction.customId.split("-")[0]
            let select = selectList[id]
            if(select){
                select.callback(interaction)
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
    onReady,
    onSelect
}
connect()
