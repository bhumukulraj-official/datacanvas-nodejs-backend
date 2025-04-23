const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        is: /^[a-zA-Z0-9_-]{3,50}$/
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [60, 255]
      },
    },
    password_salt: {
      type: DataTypes.STRING(64),
      allowNull: false,
      validate: {
        len: [8, 64]
      },
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'editor', 'user'),
      allowNull: false,
      defaultValue: 'user',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'banned'),
      allowNull: false,
      defaultValue: 'active',
    },
    is_email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    locked_until: {
      type: DataTypes.DATE,
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
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    indexes: [
      {
        name: 'idx_users_username',
        fields: ['username'],
        where: {
          deleted_at: null
        },
        unique: true
      },
      {
        name: 'idx_users_email',
        fields: ['email'],
        where: {
          deleted_at: null
        },
        unique: true
      },
      {
        name: 'idx_users_role',
        fields: ['role'],
      },
      {
        name: 'idx_users_status',
        fields: ['status'],
      },
      {
        name: 'idx_users_deleted_at',
        fields: ['deleted_at'],
      },
    ],
  }
);

// Define associations
User.associate = (models) => {
  User.hasMany(models.RefreshToken, {
    foreignKey: 'user_id',
    as: 'refreshTokens',
    onDelete: 'CASCADE'
  });
  
  User.hasMany(models.EmailVerificationToken, {
    foreignKey: 'user_id',
    as: 'emailVerificationTokens',
    onDelete: 'CASCADE'
  });
};

module.exports = User; 