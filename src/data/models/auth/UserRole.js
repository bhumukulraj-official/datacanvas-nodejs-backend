const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class UserRole extends BaseModel {
  static init(sequelize) {
    return super.init({
      code: {
        type: DataTypes.STRING(20),
        primaryKey: true
      },
      name: DataTypes.STRING(50),
      description: DataTypes.TEXT,
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      display_order: DataTypes.INTEGER
    }, {
      sequelize,
      tableName: 'user_roles',
      schema: 'auth',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: false
    });
  }

  static associate({ User }) {
    this.hasMany(User, { foreignKey: 'role', sourceKey: 'code' });
  }
}; 