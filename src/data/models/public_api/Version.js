const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class Version extends BaseModel {
  static init(sequelize) {
    return super.init({
      version: {
        type: DataTypes.STRING(10),
        primaryKey: true
      },
      base_path: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      release_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      deprecated_at: DataTypes.DATEONLY,
      sunset_date: DataTypes.DATE,
      docs_url: DataTypes.STRING(255),
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      auto_sunset: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      sequelize,
      tableName: 'versions',
      schema: 'public_api',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['is_active'] },
        { fields: ['deprecated_at'] }
      ]
    });
  }

  static associate({ VersionLifecycleLog }) {
    this.hasMany(VersionLifecycleLog, { foreignKey: 'version', sourceKey: 'version' });
  }
}; 