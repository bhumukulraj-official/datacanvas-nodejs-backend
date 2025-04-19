const { Model, DataTypes } = require('sequelize');

/**
 * Profile model representing user's personal and professional information
 */
module.exports = (sequelize) => {
  class Profile extends Model {
    static associate(models) {
      // Define association to User model (one-to-one)
      Profile.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE'
      });
    }
  }

  Profile.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    resume: {
      type: DataTypes.STRING,
      allowNull: true
    },
    socialLinks: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Profile',
    tableName: 'profiles',
    timestamps: true
  });

  return Profile;
}; 