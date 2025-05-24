const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class Message extends BaseModel {
  static init(sequelize) {
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
      conversation_id: DataTypes.INTEGER,
      content_moderated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      pii_detected: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
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
        { fields: ['conversation_id'] },
        { fields: ['is_read'] },
        { fields: ['is_deleted'] },
        { fields: ['uuid'] },
        { 
          name: 'idx_messages_metadata',
          fields: ['metadata'],
          using: 'gin'
        }
      ]
    });
  }

  static associate({ User, Project, Conversation, MessageAttachment }) {
    this.belongsTo(User, { as: 'sender', foreignKey: 'sender_id' });
    this.belongsTo(User, { as: 'receiver', foreignKey: 'receiver_id' });
    this.belongsTo(Project, { foreignKey: 'project_id' });
    this.belongsTo(Conversation, { foreignKey: 'conversation_id' });
    this.hasMany(MessageAttachment, { foreignKey: 'message_id' });
  }
}; 