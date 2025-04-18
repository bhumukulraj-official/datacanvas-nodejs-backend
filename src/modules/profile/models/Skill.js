const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class Skill extends Model {}

Skill.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    proficiency: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    icon: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_highlighted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    years_of_experience: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: true,
    },
    last_used_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    certification_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Skill',
    tableName: 'skills',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_skills_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_skills_category',
        fields: ['category'],
      },
      {
        name: 'idx_skills_is_highlighted',
        fields: ['is_highlighted'],
      },
      {
        name: 'idx_skills_display_order',
        fields: ['display_order'],
      },
      {
        name: 'idx_skills_name',
        fields: ['name'],
      },
    ],
  }
);

module.exports = Skill; 