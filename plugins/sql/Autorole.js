const config = require('../../config');
const { DataTypes } = require('sequelize');

const roleDb = config.DATABASE.define('role', {
    guildId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userRoleId: {
        type: DataTypes.STRING,
        defaultValue:""
    }
});

module.exports = roleDb
