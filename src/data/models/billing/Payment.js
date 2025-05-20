const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');

module.exports = class Payment extends BaseModel {
  static init() {
    return super.init({
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4
      },
      invoice_id: DataTypes.INTEGER,
      client_id: DataTypes.INTEGER,
      amount: DataTypes.DECIMAL(10,2),
      payment_date: DataTypes.DATEONLY,
      payment_method: DataTypes.STRING(50),
      payment_provider: DataTypes.STRING(50),
      transaction_id: DataTypes.STRING(255),
      status_code: DataTypes.STRING(20),
      provider_response: {
        type: DataTypes.JSONB,
        comment: 'Encrypted. Contains sensitive payment information'
      },
      notes: DataTypes.TEXT,
      metadata: DataTypes.JSONB,
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      tableName: 'payments',
      schema: 'billing',
      paranoid: true,
      indexes: [
        { fields: ['invoice_id'] },
        { fields: ['client_id'] },
        { fields: ['status_code'] }
      ]
    });
  }

  static associate({ Invoice, User, PaymentStatus }) {
    this.belongsTo(Invoice);
    this.belongsTo(User, { as: 'client' });
    this.belongsTo(PaymentStatus, { 
      foreignKey: 'status_code',
      targetKey: 'code'
    });
  }
}; 