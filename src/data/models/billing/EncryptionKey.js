const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class EncryptionKey extends BaseModel {
  static init(sequelize) {
    return super.init({
      version: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false
      },
      key_identifier: {
        type: DataTypes.STRING(64),
        unique: true,
        allowNull: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    }, {
      sequelize,
      tableName: 'encryption_keys',
      schema: 'billing',
      timestamps: false,
      indexes: [
        { fields: ['version'] },
        { fields: ['is_active'] }
      ]
    });
  }
}; 