const config = require("../../config");
const { DataTypes } = require("sequelize");
const {randomUUID} = require("crypto")

const suggestion = config.DATABASE.define("suggestion", {
    suggestionId: {
    type: DataTypes.STRING,
    defaultValue: randomUUID,
  },
  channels: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  authorId:{
    type: DataTypes.STRING,
    allowNull: false,
  },
  guildId:{
    type: DataTypes.STRING,
    allowNull: false,
  },
  messageId:{
    type: DataTypes.STRING,
    allowNull: false,
    unique:true
  },
  content:{
    type: DataTypes.STRING,
    allowNull: false,
  },
  status:{
    type: DataTypes.STRING,
    defaultValue:"pending"
  },
  upvotes:{
    type: DataTypes.JSON,
    defaultValue: [],
  },
  downvotes:{
    type: DataTypes.JSON,
    defaultValue: [],
  }
});

module.exports = {
    suggestion,
};
