const { Client, GatewayIntentBits,REST, Routes, Events } = require('discord.js');
require('dotenv').config();
const {CLIENT_ID,TOKEN,SUDO} = require("./config")
const fs = require("fs");

const client = new Client({ intents: [GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers] });
const rest = new REST({ version: '10' }).setToken(TOKEN);

const commands = {};
const buttons = {};
const readyList = []
const selectList = {}
const contextMenus = {}
const joinList = []

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
function onCMenu(object,callback){
    object.callback = callback
    contextMenus[object.name] = object
}
function onJoin(object,callback){
    object.callback = callback
    joinList.push(object)
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
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [...Object.values(commands),...Object.values(contextMenus)] });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
  
  
    client.on('ready',async () => {
        console.log(`Logged in as ${client.user.tag}!`);
        if(SUDO.length!=0){
            let user = await client.users.fetch(SUDO[0])
            user.send("Bot started..")
        }
        for(let i of readyList){
            i.callback(client)
        }

    });

    client.on('interactionCreate', async interaction => {
    try{

        if(interaction.isChatInputCommand()){
            let command = commands[interaction.commandName]
            if(command){
                if(!command.owner || SUDO.includes(interaction.user.id)){
                    command.callback(interaction)
                }
                else{
                    await interaction.reply("This is an owner command")
                }
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
        else if(interaction.isUserContextMenuCommand()){
            let command = contextMenus[interaction.commandName]
            if(command){
                command.callback(interaction)
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
    client.on(Events.GuildMemberAdd, (member) => {
        for(let i of joinList){
            i.callback(member)
        }
    });
      

    client.login(TOKEN);
}
module.exports = {
    Module,
    onButton,
    onReady,
    onSelect,
    onCMenu,
    onJoin
}
connect()
