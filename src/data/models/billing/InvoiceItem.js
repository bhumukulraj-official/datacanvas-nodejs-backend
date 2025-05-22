const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class InvoiceItem extends BaseModel {
  static init() {
    return super.init({
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      quantity: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        validate: { min: 0.01 }
      },
      unit_price: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        validate: { min: 0.01 }
      },
      amount: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        validate: { min: 0.01 }
      },
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
      tableName: 'invoice_items',
      schema: 'billing',
      paranoid: true,
      indexes: [
        { fields: ['invoice_id'] },
        { fields: ['is_deleted'] },
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