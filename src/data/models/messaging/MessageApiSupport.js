const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


// This model represents a view created in migration 20240901000047-create-message-api-support.js
// It doesn't have its own table but maps to views in public_api schema
module.exports = class MessageApiSupport extends BaseModel {
  static init(sequelize) {
    return super.init({
      endpoint: {
        type: DataTypes.STRING,
        primaryKey: true
      },
      description: {
        type: DataTypes.STRING
      },
      schema_name: {
        type: DataTypes.STRING
      },
      table_name: {
        type: DataTypes.STRING
      }
    }, {
      sequelize,
      tableName: 'message_endpoints',
      schema: 'public_api',
      timestamps: false
    });
  }

  // This model doesn't directly map to a database table but to a view
  // It's a read-only model for API documentation
} 