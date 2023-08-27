const {Module,onButton,onReady} = require("../index")
const { ActionRowBuilder, ButtonBuilder, ButtonStyle,EmbedBuilder ,ApplicationCommandOptionType} = require('discord.js');
const {
    YtDb,
    addYt,
    deleteYt,
    updateYt,
    findYt
} = require("./sql/youtube")
const fetch = require("node-fetch")
const FormData = require("form-data")
const xml2js = require('xml2js');
const cheerio = require('cheerio')

Module({
    name:"ytnotif",
    description:"Adds youtube new video notification",
    options: [
        {
          name: 'link',
          description: 'Yoututbe channel link.',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: 'id',
          description: 'discord channel id',
          type: ApplicationCommandOptionType.Channel,
          required: true,
        },
      ],
},async(m)=>{
    if(!m.guildId) return await m.reply("this is a guild command")
    await YtDb.sync()
    await deleteYt("747793211409301594")
    console.log(await YtDb.findAll());
    await m.deferReply();
    const link = m.options.getString("link")
    const channelId = m.options.getChannel("id")
    let guild = m.guildId
    if(! await findYt(guild)){
        let data = {
            channels:[]
        }
        let obj = await getId(link)
        obj.channel = channelId
        data.channels.push(obj)
        await addYt(guild,data);
        return await m.editReply("Channel added..")
    }
    let data = await findYt(guild)
    let obj = await getId(link)
    obj.channel = channelId
    data.data.channels.push(obj)
    await updateYt(guild,data)
    return await m.editReply("Channel added..")
})
Module({
    name:"ytnotif-remove",
    description:"To remove channel from ytnotif"
},async(m)=>{
    await m.deferReply();
    let guild = m.guildId
    let data = await findYt(guild)
    if(!data ||data.data.channels == 0){
        return await m.editReply("No channel found")
    }
    console.log(data.data);
    let row = new ActionRowBuilder()
                .addComponents(
                    data.data.channels.map((e)=>{
                        return new ButtonBuilder()
                        .setLabel(`${e.title}`)
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId(`youtube-${e.id},${e.channel}`)
                    })
                )
    return await m.editReply({ content:"Select the channel you wish to remove.", components: [row] })
})
onButton({
    name:"youtube"
},async (m)=>{
    try{
        
        let id = m.customId
        let guild = m.guildId
        let name = id.split('youtube-')[1].split(",")[0]
        let channel = id.split('youtube-')[1].split(",")[1]

        let data = await findYt(guild)
        data.data.channels = data.data.channels.filter(e => e.id !== name&&e.channel!=channel);
        await updateYt(guild,data.data)
        return await m.reply("channel removed")
        
    }
    catch(e){
        await m.deferUpdate()
        console.log(e);
        let e1 = new EmbedBuilder()
                .setDescription(`an error occured.`)
        return await m.followUp({ embeds: [e1], ephemeral: true })
    }
})

async function getData(id){
    return new Promise((resolve) => {
        fetch("https://www.youtube.com/feeds/videos.xml?channel_id="+id)
        .then(response => response.text())
        .then(xmlData => {
            xml2js.parseString(xmlData, (err, result) => {
            if (err) {
                console.error('Error:', err);
                return;
            }
            const { "yt:videoId": [id], title: [title], link: [{ $: {href: link} }] } = result.feed.entry[0];
                resolve({id,title,link})

            });
        })
        .catch(error => {
            console.error('Error:', error);
        });

    })
}

async function getId(url){
    return new Promise(async (resolve) => {
        let formdata = new FormData();
        formdata.append("v", url);
        const html = await fetch("https://ytlarge.com/youtube/channel-id-finder/channel-id-finder",{
            method: 'POST',
            body: formdata
        }).then(res=>res.text())
        let ch = cheerio.load(html)
        let id = (ch("div>b")).text()
        let title = (ch("a>b")).text()
        console.log({id,title});
        resolve({id,title})
    })
}

onReady({
    name:"yoututbe"
},async client=>{
    await YtDb.sync()
    let interval = setInterval(async() => {
        let array = await YtDb.findAll()
        for(let i of array){
            for(let j of i.data.channels){
                const {id,title,channel} = j
                const data = await getData(id)
                if(!j.vid || j.vid != data.id && j.prev != data.id){
                    j.prev = j?.vid ||false 
                    j.vid = data.id
                    await updateYt(i.name,i.data)
                    const ch = client.channels.cache.get(channel.id);
                    ch.send(`@everyone ${title} uploaded a new video\n${data.link}`)
                }
            }

        }
    }, 60*1000);
})