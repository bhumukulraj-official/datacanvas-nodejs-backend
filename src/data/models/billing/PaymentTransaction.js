const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class PaymentTransaction extends BaseModel {
  static init() {
    return super.init({
      invoice_id: DataTypes.INTEGER,
      gateway_id: DataTypes.INTEGER,
      amount: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD'
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      transaction_id: DataTypes.STRING(255),
      response_data: DataTypes.JSONB,
      distributed_xid: {
        type: DataTypes.STRING(100),
        comment: 'Distributed transaction ID'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    }, {
      sequelize,
      tableName: 'payment_transactions',
      schema: 'billing',
      timestamps: false,
      indexes: [
        { fields: ['invoice_id'] },
        { fields: ['gateway_id'] },
        { fields: ['status'] },
        { fields: ['transaction_id'] }
      ]
    });
  }

  static associate({ Invoice, PaymentGateway }) {
    this.belongsTo(Invoice, { foreignKey: 'invoice_id' });
    this.belongsTo(PaymentGateway, { foreignKey: 'gateway_id' });
  }
}; 