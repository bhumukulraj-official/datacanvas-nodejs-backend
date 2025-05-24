const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');

module.exports = class Skill extends BaseModel {
  static init(sequelize) {
    return super.init({
      name: DataTypes.STRING(100),
      category: DataTypes.STRING(50),
      proficiency: {
        type: DataTypes.INTEGER,
        validate: {
          min: 1,
          max: 5
        }
      },
      description: DataTypes.TEXT,
      is_highlighted: DataTypes.BOOLEAN,
      display_order: DataTypes.INTEGER
    }, {
      sequelize,
      tableName: 'skills',
      schema: 'content',
      paranoid: true,
      indexes: [
        { 
          name: 'idx_skills_search',
          using: 'gin',
          fields: ['name', 'category', 'description']
        }
      ]
    });
  }

  static associate({ User }) {
    this.belongsTo(User);
  }
}; 