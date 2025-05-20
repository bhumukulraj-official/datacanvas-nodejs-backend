const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class User extends BaseModel {
  static init() {
    return super.init({
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4
      },
      email: {
        type: DataTypes.STRING(255),
        unique: true
      },
      password_hash: DataTypes.STRING(255),
      name: DataTypes.STRING(100),
      role: {
        type: DataTypes.STRING(20),
        defaultValue: 'client'
      },
      email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      onboarding_status: {
        type: DataTypes.STRING(20),
        defaultValue: 'pending',
        validate: {
          isIn: [['pending', 'active', 'inactive']]
        }
      },
      onboarding_date: DataTypes.DATE,
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      deleted_at: DataTypes.DATE
    }, {
      sequelize,
      tableName: 'users',
      schema: 'auth',
      paranoid: true,
      indexes: [
        { fields: ['email'] },
        { fields: ['role'] },
        { fields: ['is_deleted'] },
        { fields: ['uuid'] },
        { 
          name: 'idx_users_metadata',
          fields: ['metadata'],
          using: 'gin'
        }
      ]
    });
  }

  static associate({ UserRole, RefreshToken, EmailVerificationToken }) {
    this.belongsTo(UserRole, { 
      foreignKey: 'role',
      sourceKey: 'code'
    });
    this.hasMany(RefreshToken);
    this.hasMany(EmailVerificationToken);
  }
}; 