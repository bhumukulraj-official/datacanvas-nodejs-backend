/**
 * Experience Model
 */
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../../shared/database');

class Experience extends Model {}

Experience.init({
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
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  company: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  technologies: {
    type: DataTypes.ARRAY(DataTypes.STRING(50)),
    allowNull: true,
    defaultValue: []
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
  modelName: 'Experience',
  tableName: 'experience',
  timestamps: true,
  underscored: true,
  paranoid: true, // Enable soft deletes
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  hooks: {
    beforeValidate: (experience, options) => {
      // Validate that end_date is after start_date if provided
      if (experience.end_date && experience.start_date && 
          new Date(experience.end_date) < new Date(experience.start_date)) {
        throw new Error('End date must be after start date');
      }
    }
  }
});

module.exports = Experience; 