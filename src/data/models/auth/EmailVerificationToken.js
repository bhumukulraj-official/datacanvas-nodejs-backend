const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class EmailVerificationToken extends BaseModel {
  static init(sequelize) {
    return super.init({
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      token: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false
      }
    }, {
      sequelize,
      tableName: 'email_verification_tokens',
      schema: 'auth',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false, // No updated_at in migration
      indexes: [
        { fields: ['user_id'] },
        { fields: ['token'] }
      ]
    });
  }

  static associate({ User }) {
    this.belongsTo(User, { foreignKey: 'user_id' });
  }
}; 