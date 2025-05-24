const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class EncryptionKeyAudit extends BaseModel {
  static init(sequelize) {
    return super.init({
      operation: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      key_version: DataTypes.INTEGER,
      performed_by: DataTypes.TEXT,
      ip_address: DataTypes.TEXT,
      operation_timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, {
      sequelize,
      tableName: 'encryption_key_audit',
      schema: 'billing',
      timestamps: false,
      indexes: [
        { fields: ['key_version'] },
        { fields: ['operation'] },
        { fields: ['operation_timestamp'] }
      ]
    });
  }

  static associate({ EncryptionKey }) {
    this.belongsTo(EncryptionKey, { 
      foreignKey: 'key_version', 
      targetKey: 'version' 
    });
  }
}; 