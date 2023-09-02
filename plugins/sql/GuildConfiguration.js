const config = require('../../config');
const { DataTypes } = require('sequelize');

const gcfDb = config.DATABASE.define('gcf', {
    guildId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    channels: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue:[]
    }
});
async function addgcf(guildId, channels) {
    var gcf = await gcfDb.findAll({
        where: {guildId: guildId}
    });

    if (gcf.length >= 1) {
        return false;
    } else {
        return await gcfDb.create({ channels: channels, guildId: guildId });
    }
}
async function deletegcf(guildId) {
    const deletedRows = await gcfDb.destroy({
      where: { guildId: guildId },
    });
    return deletedRows > 0;
}
async function updategcf(guildId, channels) {
    const gcf = await gcfDb.findOne({
        where: { guildId: guildId }
    });

    if (!gcf) {
        return false;
    }

    gcf.channels = channels;
    await gcf.save();
    return true; 
}
async function findgcf(guildId) {
    try {
        const foundRecord = (await gcfDb.findAll()).find(c => c.guildId === guildId);
        
        return foundRecord;
    } catch (error) {
        console.error("Error while finding record:", error);
        throw error;
    }
}


module.exports = {
    gcfDb,
    addgcf,
    deletegcf,
    updategcf,
    findgcf
}