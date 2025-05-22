const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class ApiDocumentation extends BaseModel {
  static init() {
    return super.init({
      endpoint: {
        type: DataTypes.STRING(255),
        primaryKey: true
      },
      method: {
        type: DataTypes.STRING(10),
        allowNull: false
      },
      description: DataTypes.TEXT,
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      api_version: {
        type: DataTypes.STRING(10),
        defaultValue: '1.0'
      }
    }, {
      sequelize,
      tableName: 'documentation',
      schema: 'public_api',
      timestamps: false
    });
  }
}; 