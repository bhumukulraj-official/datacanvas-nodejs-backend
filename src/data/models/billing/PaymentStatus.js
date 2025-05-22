const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class PaymentStatus extends BaseModel {
  static init() {
    return super.init({
      code: {
        type: DataTypes.STRING(20),
        primaryKey: true
      },
      name: DataTypes.STRING(50),
      description: DataTypes.TEXT,
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      display_order: DataTypes.INTEGER
    }, {
      sequelize,
      tableName: 'payment_statuses',
      schema: 'billing',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['code'] },
        { fields: ['is_active'] }
      ]
    });
  }

  static associate({ Payment }) {
    this.hasMany(Payment, { foreignKey: 'status_code' });
  }
}; 