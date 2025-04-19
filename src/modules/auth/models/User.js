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
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'user',
      validate: {
        isIn: [['admin', 'user']],
      },
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Password management fields
    password_updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    password_history: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Stores last 5 password hashes to prevent reuse',
    },
    // Account lockout fields
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of consecutive failed login attempts',
    },
    locked_until: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Account locked until this time after too many failed attempts',
    },
    // Session management fields
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_login_ip: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    active_sessions: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Track active sessions with IDs, IP addresses, and devices',
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
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_users_email',
        fields: ['email'],
      },
      {
        name: 'idx_users_role',
        fields: ['role'],
      },
    ],
  }
);

module.exports = User; 