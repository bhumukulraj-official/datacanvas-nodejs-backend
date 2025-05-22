const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class ProjectVisibility extends BaseModel {
  static init() {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      project_id: DataTypes.INTEGER,
      visibility_level: {
        type: DataTypes.STRING(20),
        validate: {
          isIn: [['portfolio', 'private', 'client_only']]
        }
      },
      client_exceptions: {
        type: DataTypes.JSONB,
        defaultValue: {}
      }
    }, {
      sequelize,
      tableName: 'project_visibility',
      schema: 'content',
      indexes: [
        { fields: ['project_id'] },
        { fields: ['visibility_level'] }
      ]
    });
  }

  static associate({ Project }) {
    this.belongsTo(Project, { foreignKey: 'project_id' });
  }
}; 