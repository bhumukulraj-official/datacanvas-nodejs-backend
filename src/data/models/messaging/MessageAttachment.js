const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class MessageAttachment extends BaseModel {
  static init() {
    return super.init({
      message_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      file_url: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      filename: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      file_size: DataTypes.BIGINT,
      file_type: DataTypes.STRING(100),
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      sequelize,
      tableName: 'message_attachments',
      schema: 'messaging',
      paranoid: true,
      deletedAt: 'deleted_at',
      indexes: [
        { fields: ['message_id'] },
        { fields: ['file_type'] },
        { fields: ['is_deleted'] }
      ]
    });
  }

  static associate({ Message }) {
    this.belongsTo(Message, { foreignKey: 'message_id' });
  }
}; 