const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class ProjectUpdate extends BaseModel {
  static init() {
    return super.init({
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4
      },
      title: DataTypes.STRING(200),
      description: DataTypes.TEXT,
      update_date: DataTypes.DATE,
      notify_client: DataTypes.BOOLEAN,
      notified_at: DataTypes.DATE,
      client_viewed_at: DataTypes.DATE,
      additional_data: DataTypes.JSONB,
      created_by: DataTypes.INTEGER
    }, {
      sequelize,
      tableName: 'project_updates',
      schema: 'content',
      paranoid: true
    });
  }

  static associate({ Project, User }) {
    this.belongsTo(Project);
    this.belongsTo(User, { 
      foreignKey: 'created_by',
      as: 'author'
    });
  }
}; 