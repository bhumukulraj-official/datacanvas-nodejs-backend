const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class EmailVerificationToken extends BaseModel {
  static init() {
    return super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      token: {
        type: DataTypes.STRING(255),
        unique: true
      },
      expires_at: DataTypes.DATE,
      created_at: DataTypes.DATE
    }, {
      sequelize,
      tableName: 'email_verification_tokens',
      schema: 'auth',
      indexes: [
        { fields: ['user_id'] },
        { fields: ['token'] },
        { fields: ['created_at'] }
      ]
    });
  }

  static associate({ User }) {
    this.belongsTo(User, { foreignKey: 'user_id' });
  }
}; 