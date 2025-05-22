const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class ClientProjectPermission extends BaseModel {
  static init() {
    return super.init({
      assignment_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      can_view_files: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      can_view_updates: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      can_download: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      can_message: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      can_view_invoices: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      can_make_payments: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      can_invite_collaborators: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      custom_permissions: {
        type: DataTypes.JSONB,
        defaultValue: {}
      }
    }, {
      sequelize,
      tableName: 'client_project_permissions',
      schema: 'content',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  }

  static associate({ ProjectClientAssignment }) {
    this.belongsTo(ProjectClientAssignment, { foreignKey: 'assignment_id' });
  }
}; 