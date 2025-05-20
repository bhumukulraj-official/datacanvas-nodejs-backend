const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class Skill extends BaseModel {
  static init() {
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
          fields: [sequelize.literal("to_tsvector('english', name || ' ' || COALESCE(category, '') || ' ' || COALESCE(description, ''))")],
          using: 'gin'
        }
      ]
    });
  }

  static associate({ User }) {
    this.belongsTo(User);
  }
}; 