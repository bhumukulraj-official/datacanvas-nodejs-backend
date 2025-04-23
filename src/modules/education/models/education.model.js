/**
 * Education Model
 */
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../../shared/database');

class Education extends Model {}

Education.init({
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
  institution: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  degree: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  field_of_study: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  is_current: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  grade: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  activities: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true
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
  modelName: 'Education',
  tableName: 'education',
  timestamps: true,
  underscored: true,
  paranoid: true, // Enable soft deletes
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  hooks: {
    beforeValidate: (education, options) => {
      // Validate that end_date is after start_date if provided
      if (education.end_date && education.start_date && 
          new Date(education.end_date) < new Date(education.start_date)) {
        throw new Error('End date must be after start date');
      }
      
      // If marked as current, end_date should be null
      if (education.is_current && education.end_date) {
        education.end_date = null;
      }
    }
  }
});

module.exports = Education; 