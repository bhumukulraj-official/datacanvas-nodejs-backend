const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class ContactSubmission extends Model {
  static associate(models) {
    // Define association here
    this.belongsTo(models.User, {
      foreignKey: 'assigned_to',
      as: 'assignedUser'
    });
  }
}

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
      type: DataTypes.ENUM('new', 'read', 'replied', 'spam', 'archived'),
      defaultValue: 'new',
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    recaptcha_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    recaptcha_score: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    replied_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reply_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
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
    modelName: 'ContactSubmission',
    tableName: 'contact_submissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
    indexes: [
      {
        name: 'idx_contact_submissions_status',
        fields: ['status'],
      },
      {
        name: 'idx_contact_submissions_created_at',
        fields: ['created_at'],
      },
      {
        name: 'idx_contact_submissions_assigned_to',
        fields: ['assigned_to'],
      },
    ],
  }
);

module.exports = ContactSubmission; 