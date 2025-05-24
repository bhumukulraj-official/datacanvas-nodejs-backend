const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class InvoiceStatus extends BaseModel {
  static init(sequelize) {
    return super.init({
      code: {
        type: DataTypes.STRING(20),
        primaryKey: true
      },
      name: DataTypes.STRING(50),
      description: DataTypes.TEXT,
      is_active: DataTypes.BOOLEAN,
      display_order: DataTypes.INTEGER
    }, {
      sequelize,
      tableName: 'invoice_statuses',
      schema: 'billing',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false
    });
  }

  static associate({ Invoice }) {
    this.hasMany(Invoice, { foreignKey: 'status_code' });
  }
}; 