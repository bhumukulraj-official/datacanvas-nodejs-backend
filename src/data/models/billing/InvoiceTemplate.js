const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class InvoiceTemplate extends BaseModel {
  static init() {
    return super.init({
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      template_type: {
        type: DataTypes.STRING(50),
        defaultValue: 'html'
      },
      variables: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      styles: DataTypes.TEXT,
      footer: DataTypes.TEXT
    }, {
      sequelize,
      tableName: 'invoice_templates',
      schema: 'billing',
      indexes: [
        { fields: ['is_default'] }
      ]
    });
  }
}; 