const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class ProjectFile extends BaseModel {
  static init() {
    return super.init({
      file_url: {
        type: DataTypes.STRING(255),
        validate: {
          isUrl: true
        }
      },
      filename: DataTypes.STRING(255),
      file_size: DataTypes.BIGINT,
      file_type: DataTypes.STRING(100),
      version: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
          min: 1
        }
      },
      description: DataTypes.TEXT,
      uploaded_by: DataTypes.INTEGER,
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      sequelize,
      tableName: 'project_files',
      schema: 'content',
      paranoid: true
    });
  }

  static associate({ Project, User }) {
    this.belongsTo(Project);
    this.belongsTo(User, { 
      foreignKey: 'uploaded_by',
      as: 'uploader',
      onDelete: 'NO ACTION'
    });
  }
}; 