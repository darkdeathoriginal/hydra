const config = require("../../config");
const { DataTypes } = require("sequelize");
const {randomUUID} = require("crypto")

const buildDb = config.DATABASE.define("build", {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    channelId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
    }
})
const buildItemsDb = config.DATABASE.define("buildItems", {
    buildId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    item: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
    }
})
module.exports = {buildDb, buildItemsDb}