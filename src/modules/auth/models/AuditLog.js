/**
 * Authentication Audit Log Model
 * Stores user authentication and authorization events for security audit and compliance
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../shared/database');

const AuditLog = sequelize.define(
  'auth_audit_log',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true, // Null for failed login attempts with non-existent users
      references: {
        model: 'users',
        key: 'id',
      },
    },
    event_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Type of event (login, logout, password_change, etc)',
    },
    ip_address: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'IP address of the client',
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User agent string of the client',
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional details about the event',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'Status of the event (success, failure)',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // Audit logs should never be updated
    underscored: true,
  }
);

module.exports = AuditLog; 