const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class ErrorColorMapping extends BaseModel {
  static init() {
    return super.init({
      error_category: {
        type: DataTypes.STRING(50),
        primaryKey: true
      },
      ui_color: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      hex_code: {
        type: DataTypes.STRING(7),
        allowNull: false
      },
      usage_description: DataTypes.TEXT
    }, {
      sequelize,
      tableName: 'error_color_mappings',
      schema: 'public',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    });
  }
}; 