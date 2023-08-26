const {Module,addButton} = require("../index")
const { ActionRowBuilder, ButtonBuilder, ButtonStyle,EmbedBuilder } = require('discord.js');
const { ApplicationCommandOptionType } = require('discord.js');

const roles = []

Module({
    name:"add-role",
    description:"adds a role",
    options: [
        {
          name: 'role',
          description: 'The role you want users to get on join.',
          type: ApplicationCommandOptionType.Role,
          required: true,
        },
        {
          name: 'emoji',
          description: 'Emoji you want to set for this role.',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    
},async(m)=>{
    if (m.member.permissions.has("MANAGE_ROLES")){
        const role = m.options.getRole("role")
        const emoji = m.options.getString("emoji")
        roles.push({role,emoji})
        console.log(roles);
        let e1 = new EmbedBuilder()
            .setColor(role.color)
            .setDescription(`role added.`)
        m.reply({ embeds: [e1], ephemeral: true })
    }
    else{
        return await m.reply("You dont have permission")
    }
})

Module({
    name:"set-role",
    description:"sends role message"
},async m=>{
    if (m.member.permissions.has("MANAGE_ROLES")){
        if(roles.length == 0){
            return m.reply("no roles have been added. Use /add-role to add roles")
        }
        let row = new ActionRowBuilder()
                .addComponents(
                    roles.map(e=>{
                        return new ButtonBuilder()
                        .setLabel(`${e.role.name}`)
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId(`role-${e.role.id}`)
                        .setEmoji(e.emoji)
                    })
                )
        roles.length = 0
        return await m.reply({ content:"Press the buttons to give yourself a role", components: [row] })
    }
    else{
        return await m.reply("You dont have permission")
    }
})

addButton({
    name:"role"
},async (m)=>{
    try{
        
        await m.deferUpdate()
        let id = m.customId
        let role = id.split('role-')[1]
        role = m.guild.roles.cache.get(role)
        if(role){
            await m.member.roles.add(role.id)
            let e1 = new EmbedBuilder()
                .setColor(role.color)
                .setDescription(`${role.name} role has been added to you.`)
            m.followUp({ embeds: [e1], ephemeral: true })
        }
    }
    catch(e){
        console.log(e);
        let e1 = new EmbedBuilder()
                .setDescription(`an error occured.`)
        return await m.followUp({ embeds: [e1], ephemeral: true })
    }
})