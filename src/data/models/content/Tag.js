const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class Tag extends BaseModel {
  static init() {
    return super.init({
      name: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
      },
      slug: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
      },
      category: DataTypes.STRING(50),
      is_technology: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      sequelize,
      tableName: 'tags',
      schema: 'content',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      indexes: [
        { fields: ['name'] },
        { fields: ['slug'] },
        { fields: ['category'] },
        { fields: ['is_technology'] }
      ]
    });
  }

  static associate({ Project, ProjectTag }) {
    this.belongsToMany(Project, { through: ProjectTag, foreignKey: 'tag_id' });
  }
}; 