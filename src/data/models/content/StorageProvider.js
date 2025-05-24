const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class StorageProvider extends BaseModel {
  static init(sequelize) {
    return super.init({
      code: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      provider_type: {
        type: DataTypes.STRING(20),
        validate: {
          isIn: [['local', 's3', 'cloudinary', 'firebase', 'other']]
        }
      },
      configuration: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      sequelize,
      tableName: 'storage_providers',
      schema: 'content',
      indexes: [
        { fields: ['code'] },
        { fields: ['is_active'] },
        { fields: ['is_default'] }
      ]
    });
  }

  static associate({ FileUpload }) {
    this.hasMany(FileUpload, { foreignKey: 'storage_provider_id' });
  }
}; 