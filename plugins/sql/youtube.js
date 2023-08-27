const config = require('../../config');
const { DataTypes } = require('sequelize');

const YtDb = config.DATABASE.define('Yt', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    data: {
        type: DataTypes.JSON,
        allowNull: false
    }
});
async function addYt(name, data) {
    var yt = await YtDb.findAll({
        where: {name: name}
    });

    if (yt.length >= 1) {
        return false;
    } else {
        return await YtDb.create({ data: data, name: name });
    }
}
async function deleteYt(name) {
    const deletedRows = await YtDb.destroy({
      where: { name: name },
    });
    return deletedRows > 0;
}
async function updateYt(name, data) {
    const yt = await YtDb.findOne({
        where: { name: name }
    });

    if (!yt) {
        return false;
    }

    yt.data = data;
    await yt.save();
    return true; 
}
async function findYt(name) {
    try {
        const foundRecord = (await YtDb.findAll()).find(c => c.name === name);
        
        return foundRecord;
    } catch (error) {
        console.error("Error while finding record:", error);
        throw error;
    }
}


module.exports = {
    YtDb,
    addYt,
    deleteYt,
    updateYt,
    findYt
}