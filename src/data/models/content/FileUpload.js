const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class FileUpload extends BaseModel {
  static init() {
    return super.init({
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true
      },
      user_id: DataTypes.INTEGER,
      original_filename: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      storage_filename: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      file_size: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      mime_type: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      file_extension: DataTypes.STRING(20),
      storage_provider_id: DataTypes.INTEGER,
      storage_path: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      public_url: DataTypes.TEXT,
      entity_type: DataTypes.STRING(50),
      entity_id: DataTypes.INTEGER,
      is_public: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      file_type_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      virus_scan_status: {
        type: DataTypes.STRING(20),
        defaultValue: 'pending'
      }
    }, {
      sequelize,
      tableName: 'file_uploads',
      schema: 'content',
      paranoid: true,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['entity_type', 'entity_id'] },
        { fields: ['mime_type'] },
        { fields: ['is_public'] },
        { fields: ['is_deleted'] },
        { fields: ['metadata'], using: 'gin' }
      ]
    });
  }

  static associate({ User, StorageProvider }) {
    this.belongsTo(User, { foreignKey: 'user_id' });
    this.belongsTo(StorageProvider, { foreignKey: 'storage_provider_id' });
  }
}; 