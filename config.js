DATABASE_URL = process.env.DATABASE_URL === undefined ? './bot.db' : process.env.DATABASE_URL;
const { Sequelize } = require('sequelize');

module.exports = {
    TOKEN : process.env.TOKEN,
    CLIENT_ID : process.env.CLIENT_ID,
    DATABASE: DATABASE_URL === './bot.db' ? new Sequelize({ dialect: "sqlite", storage: DATABASE_URL, logging: false }) : new Sequelize(DATABASE_URL, { dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }, logging: false }),   
}