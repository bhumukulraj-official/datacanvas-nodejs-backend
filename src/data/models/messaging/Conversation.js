const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class Conversation extends BaseModel {
  static init() {
    return super.init({
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true
      },
      subject: DataTypes.STRING(200),
      last_message_id: DataTypes.INTEGER,
      last_message_at: DataTypes.DATE,
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      sequelize,
      tableName: 'conversations',
      schema: 'messaging',
      paranoid: true,
      deletedAt: 'deleted_at',
      indexes: [
        { fields: ['last_message_at'] },
        { fields: ['uuid'] }
      ]
    });
  }

  static associate({ Message, ConversationParticipant, User }) {
    this.belongsTo(Message, { as: 'lastMessage', foreignKey: 'last_message_id' });
    this.hasMany(Message, { 
      foreignKey: 'conversation_id',
      onDelete: 'CASCADE'
    });
    this.hasMany(ConversationParticipant, { foreignKey: 'conversation_id' });
    
    // Many-to-many relationship with users through participants
    this.belongsToMany(User, { 
      through: ConversationParticipant,
      foreignKey: 'conversation_id',
      otherKey: 'user_id'
    });
  }
}; 