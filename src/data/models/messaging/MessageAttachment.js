const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class MessageAttachment extends BaseModel {
  static init() {
    return super.init({
      file_url: DataTypes.STRING(255),
      filename: DataTypes.STRING(255),
      file_size: DataTypes.BIGINT,
      file_type: DataTypes.STRING(100)
    }, {
      sequelize,
      tableName: 'message_attachments',
      schema: 'messaging',
      paranoid: true
    });
  }

  static associate({ Message }) {
    this.belongsTo(Message);
  }
}; 