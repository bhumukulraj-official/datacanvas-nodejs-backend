const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class Project extends BaseModel {
  static init(sequelize) {
    return super.init({
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true
      },
      title: DataTypes.STRING(200),
      description: DataTypes.TEXT,
      thumbnail_url: DataTypes.STRING(255),
      tags: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        validate: {
          isArray: true
        }
      },
      technologies: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
        validate: { isArray: true }
      },
      github_url: DataTypes.STRING(255),
      live_url: DataTypes.STRING(255),
      is_featured: DataTypes.BOOLEAN,
      status_code: {
        type: DataTypes.STRING(20),
        defaultValue: 'draft'
      },
      visibility: {
        type: DataTypes.STRING(15),
        defaultValue: 'portfolio',
        validate: {
          isIn: [['portfolio', 'private', 'client_only']]
        }
      },
      custom_fields: DataTypes.JSONB,
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      sequelize,
      tableName: 'projects',
      schema: 'content',
      paranoid: true,
      deletedAt: 'deleted_at',
      indexes: [
        { fields: ['visibility'] },
        { 
          name: 'idx_projects_created_at_brin',
          fields: ['created_at'],
          using: 'brin'
        }
      ]
    });
  }

  static associate({ User, ProjectStatus }) {
    this.belongsTo(User);
    this.belongsTo(ProjectStatus, { foreignKey: 'status_code' });
  }
}; 