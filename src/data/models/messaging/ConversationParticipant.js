const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class ConversationParticipant extends BaseModel {
  static init() {
    return super.init({
      conversation_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      last_read_message_id: DataTypes.INTEGER,
      is_muted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      sequelize,
      tableName: 'conversation_participants',
      schema: 'messaging',
      paranoid: true,
      indexes: [
        { fields: ['user_id'] }
      ]
    });
  }

  static associate({ Conversation, User, Message }) {
    this.belongsTo(Conversation, { foreignKey: 'conversation_id' });
    this.belongsTo(User, { foreignKey: 'user_id' });
    this.belongsTo(Message, { as: 'lastReadMessage', foreignKey: 'last_read_message_id' });
  }
}; 