const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class PublicApiView extends BaseModel {
  static init(sequelize) {
    return super.init({
      name: {
        type: DataTypes.STRING(100),
        primaryKey: true
      },
      view_definition: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      schema_name: {
        type: DataTypes.STRING(50),
        defaultValue: 'public_api'
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      description: DataTypes.TEXT,
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
      }
    }, {
      sequelize,
      tableName: 'api_views',
      schema: 'public_api',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  }
}; 