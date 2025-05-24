const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class ProjectStatus extends BaseModel {
  static init(sequelize) {
    return super.init({
      code: {
        type: DataTypes.STRING(20),
        primaryKey: true
      },
      name: DataTypes.STRING(50),
      description: DataTypes.TEXT,
      is_active: DataTypes.BOOLEAN,
      display_order: DataTypes.INTEGER
    }, {
      sequelize,
      tableName: 'project_statuses',
      schema: 'content'
    });
  }

  static associate({ Project }) {
    this.hasMany(Project, { foreignKey: 'status_code' });
  }
}; 