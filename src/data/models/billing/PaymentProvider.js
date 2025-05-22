const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class PaymentProvider extends BaseModel {
  static init() {
    return super.init({
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      code: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      config: {
        type: DataTypes.JSONB,
        allowNull: false
      },
      supports_refunds: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      supports_partial_payments: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      webhook_url: DataTypes.STRING(255),
      test_mode: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      sequelize,
      tableName: 'payment_providers',
      schema: 'billing',
      indexes: [
        { fields: ['code'] },
        { fields: ['is_active'] }
      ]
    });
  }

  static associate({ PaymentGateway, Webhook }) {
    this.hasMany(PaymentGateway, { foreignKey: 'provider', sourceKey: 'code' });
    this.hasMany(Webhook, { foreignKey: 'provider', sourceKey: 'code' });
  }
}; 