const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class ContactSubmission extends Model {}

ContactSubmission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    subject: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(10),
      defaultValue: 'new',
      validate: {
        isIn: [['new', 'read', 'replied', 'archived']],
      },
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    recaptcha_token: {
      type: DataTypes.STRING(255),
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
  },
  {
    sequelize,
    modelName: 'ContactSubmission',
    tableName: 'contact_submissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_contact_submissions_status',
        fields: ['status'],
      },
      {
        name: 'idx_contact_submissions_created_at',
        fields: ['created_at'],
      },
    ],
  }
);

module.exports = ContactSubmission; 