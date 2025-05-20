const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class InvoiceItem extends BaseModel {
  static init() {
    return super.init({
      description: DataTypes.TEXT,
      quantity: {
        type: DataTypes.DECIMAL(10,2),
        validate: { min: 0.01 }
      },
      unit_price: {
        type: DataTypes.DECIMAL(10,2),
        validate: { min: 0.01 }
      },
      amount: {
        type: DataTypes.DECIMAL(10,2),
        validate: { min: 0.01 }
      },
      metadata: DataTypes.JSONB,
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      sequelize,
      tableName: 'invoice_items',
      schema: 'billing',
      paranoid: true,
      indexes: [
        { fields: ['invoice_id'] },
        { 
          name: 'idx_invoice_items_metadata',
          fields: ['metadata'],
          using: 'gin'
        }
      ]
    });
  }

  static associate({ Invoice }) {
    this.belongsTo(Invoice);
  }
}; 