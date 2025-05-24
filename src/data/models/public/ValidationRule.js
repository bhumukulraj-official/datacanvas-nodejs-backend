const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class ValidationRule extends BaseModel {
  static init(sequelize) {
    return super.init({
      entity_type: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      field_name: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      rule_type: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      rule_value: DataTypes.TEXT,
      error_message: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    }, {
      sequelize,
      tableName: 'validation_rules',
      schema: 'public',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      indexes: [
        { fields: ['entity_type'] },
        { fields: ['field_name'] },
        { 
          fields: ['entity_type', 'field_name', 'rule_type'],
          unique: true
        }
      ]
    });
  }
}; 