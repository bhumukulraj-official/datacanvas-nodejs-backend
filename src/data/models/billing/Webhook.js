const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class Webhook extends BaseModel {
  static init() {
    return super.init({
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true
      },
      provider: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      event_type: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      payload: {
        type: DataTypes.JSONB,
        allowNull: false
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: 'pending'
      },
      attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      next_retry_at: DataTypes.DATE
    }, {
      sequelize,
      tableName: 'webhooks',
      schema: 'billing',
      indexes: [
        { fields: ['provider'] },
        { fields: ['status'] },
        { fields: ['next_retry_at'] }
      ]
    });
  }

  static associate({ PaymentProvider }) {
    this.belongsTo(PaymentProvider, { 
      foreignKey: 'provider', 
      targetKey: 'code'
    });
  }
}; 