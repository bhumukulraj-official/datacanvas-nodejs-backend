const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class ProjectTag extends BaseModel {
  static init(sequelize) {
    return super.init({
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      tag_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      }
    }, {
      sequelize,
      tableName: 'project_tags',
      schema: 'content',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false
    });
  }

  static associate({ Project, Tag }) {
    this.belongsTo(Project, { foreignKey: 'project_id' });
    this.belongsTo(Tag, { foreignKey: 'tag_id' });
  }
}; 