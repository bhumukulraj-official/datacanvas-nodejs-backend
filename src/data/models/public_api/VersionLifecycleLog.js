const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class VersionLifecycleLog extends BaseModel {
  static init() {
    return super.init({
      version: {
        type: DataTypes.STRING(10),
        allowNull: false
      },
      action: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      details: DataTypes.JSONB,
      performed_by: DataTypes.TEXT,
      performed_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, {
      sequelize,
      tableName: 'version_lifecycle_logs',
      schema: 'public_api',
      timestamps: false,
      indexes: [
        { fields: ['version'] },
        { fields: ['action'] }
      ]
    });
  }

  static associate({ Version }) {
    this.belongsTo(Version, { foreignKey: 'version', targetKey: 'version' });
  }
}; 