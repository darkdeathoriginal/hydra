const config = require("../../config");
const { DataTypes } = require("sequelize");

const minecraftServerDb = config.DATABASE.define("minecraftServer", {
    url:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    port:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    guildId:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    currentChannel:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    maxChannel:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    versionChannel:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    statusChannel:{
        type: DataTypes.STRING,
        allowNull: false,
    }
})
module.exports = {minecraftServerDb}