/**
 * Skill Model
 */
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../../shared/database');

class Skill extends Model {}

Skill.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  proficiency: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  icon: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_highlighted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  display_order: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  years_of_experience: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  last_used_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  certification_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Skill',
  tableName: 'skills',
  timestamps: true,
  underscored: true,
  paranoid: true, // Enable soft deletes
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at'
});

module.exports = Skill; 