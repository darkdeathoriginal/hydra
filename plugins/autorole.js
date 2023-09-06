const { ApplicationCommandOptionType, PermissionFlagsBits ,Interaction, GuildMember} = require("discord.js");
const { Module,onJoin } = require("..");
const roleDb = require("./sql/Autorole");
const { where } = require("sequelize");

Module({
    name:"autorole-configure",
    description:"Auto role configurator",
    dm_permission: false,
    options: [
        {
          name: "role",
          description: "Role for user",
          required: true,
          type: ApplicationCommandOptionType.Role,
        },
      ],
    default_member_permissions:PermissionFlagsBits.Administrator.toString()
},/**
 * 
 * @param {Interaction} m 
 */
async(m)=>{
    await roleDb.sync()
    const [db, created] = await roleDb.findOrCreate({
        where: { guildId: m.guildId },
        defaults: { guildId: m.guildId },
      });

    const role = m.options.getRole("role");

        db.userRoleId = role.id
        await db.save()
        return await m.reply({
            content:"User role added..",
            ephermal:true
        })
    
    
})

onJoin({
    name:"autorole"
},/**
 * 
 * @param {GuildMember} m 
 */
async(m)=>{
    await roleDb.sync()
    let db = (await roleDb.findAll()).find(e=>e.guildId == m.guild.id)
    if(!db)return;
    const role = m.guild.roles.cache.get(db.userRoleId);
    if(!role)return;
    await m.roles.add(role.id)
})
