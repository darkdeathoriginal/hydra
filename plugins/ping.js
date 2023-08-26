const {Module} = require("../index")

Module({
    name:"ping",
    description:"replies a pong message"
},async(m)=>{
    await m.reply('Pong!');
})