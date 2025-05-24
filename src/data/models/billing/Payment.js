const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class Payment extends BaseModel {
  static init(sequelize) {
    return super.init({
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true
      },
      invoice_id: DataTypes.INTEGER,
      client_id: DataTypes.INTEGER,
      amount: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        validate: { min: 0 }
      },
      payment_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      payment_method: {
        type: DataTypes.STRING(50),
        validate: {
          isIn: [['credit_card', 'bank_transfer', 'paypal']]
        }
      },
      payment_provider: DataTypes.STRING(50),
      transaction_id: DataTypes.STRING(255),
      status_code: DataTypes.STRING(20),
      provider_response: {
        type: DataTypes.BLOB, // BYTEA in PostgreSQL maps to BLOB in Sequelize
        comment: 'Encrypted. Contains sensitive payment information'
      },
      notes: DataTypes.TEXT,
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      sequelize,
      tableName: 'payments',
      schema: 'billing',
      paranoid: true,
      indexes: [
        { fields: ['invoice_id'] },
        { fields: ['client_id'] },
        { fields: ['status_code'] },
        { fields: ['transaction_id'] },
        { fields: ['is_deleted'] },
        { fields: ['uuid'] },
        { fields: ['metadata'], using: 'gin' }
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