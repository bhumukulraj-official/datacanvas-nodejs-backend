const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class ClientInvitation extends BaseModel {
  static init() {
    return super.init({
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      invitation_token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
      },
      custom_message: DataTypes.TEXT,
      sender_id: DataTypes.INTEGER,
      is_accepted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      accepted_at: DataTypes.DATE,
      accepted_by_user_id: DataTypes.INTEGER,
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      is_revoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      revoked_at: DataTypes.DATE,
      revoked_by: DataTypes.INTEGER,
      max_uses: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      used_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    }, {
      sequelize,
      tableName: 'client_invitations',
      schema: 'auth',
      indexes: [
        { fields: ['email'] },
        { fields: ['invitation_token'] },
        { fields: ['sender_id'] },
        { fields: ['is_accepted'] },
        { fields: ['expires_at'] },
        { fields: ['is_revoked'] },
        { fields: ['metadata'], using: 'gin' }
      ]
    });
  }

  static associate({ User }) {
    this.belongsTo(User, { as: 'sender', foreignKey: 'sender_id' });
    this.belongsTo(User, { as: 'acceptedBy', foreignKey: 'accepted_by_user_id' });
    this.belongsTo(User, { as: 'revokedBy', foreignKey: 'revoked_by' });
  }
}; 