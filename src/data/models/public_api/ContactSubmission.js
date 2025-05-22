const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class ContactSubmission extends BaseModel {
  static init() {
    return super.init({
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      subject: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      ip_address: {
        type: DataTypes.STRING(45),
        validate: {
          isIP: true
        }
      },
      user_agent: DataTypes.TEXT,
      recaptcha_score: DataTypes.DECIMAL(3,2),
      status: {
        type: DataTypes.STRING(20),
        defaultValue: 'pending',
        validate: {
          isIn: [['pending', 'reviewed', 'replied', 'spam']]
        }
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      sequelize,
      tableName: 'contact_submissions',
      schema: 'public_api',
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      indexes: [
        { fields: ['email'] },
        { fields: ['status'] },
        { fields: ['is_deleted'] },
        { fields: ['created_at'] }
      ]
    });
  }
}; 