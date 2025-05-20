const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class Message extends BaseModel {
  static init() {
    return super.init({
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4
      },
      content: DataTypes.TEXT,
      is_read: DataTypes.BOOLEAN,
      read_at: DataTypes.DATE,
      metadata: DataTypes.JSONB,
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      receiver_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
    }, {
      sequelize,
      tableName: 'messages',
      schema: 'messaging',
      paranoid: true,
      deletedAt: 'deleted_at',
      indexes: [
        { fields: ['sender_id'] },
        { fields: ['receiver_id'] },
        { fields: ['project_id'] },
        { fields: ['is_read'] },
        { fields: ['is_deleted'] },
        { 
          name: 'idx_messages_metadata',
          fields: ['metadata'],
          using: 'gin'
        }
      ]
    });
  }

  static associate({ User, Project }) {
    this.belongsTo(User, { as: 'sender' });
    this.belongsTo(User, { as: 'receiver' });
    this.belongsTo(Project);
  }
}; 