const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class UserRole extends BaseModel {
  static init() {
    return super.init({
      code: {
        type: DataTypes.STRING(20),
        primaryKey: true
      },
      name: DataTypes.STRING(50),
      description: DataTypes.TEXT,
      is_active: DataTypes.BOOLEAN,
      display_order: DataTypes.INTEGER
    }, {
      sequelize,
      tableName: 'user_roles',
      schema: 'auth',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      paranoid: false
    });
  }

  static associate({ User }) {
    this.hasMany(User, { foreignKey: 'role', sourceKey: 'code' });
  }
}; 