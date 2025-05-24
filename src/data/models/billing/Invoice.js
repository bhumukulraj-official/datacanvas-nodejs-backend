const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class Invoice extends BaseModel {
  static init(sequelize) {
    return super.init({
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true
      },
      invoice_number: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
      },
      amount: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        validate: { min: 0 }
      },
      tax: {
        type: DataTypes.DECIMAL(10,2),
        defaultValue: 0,
        validate: { min: 0 }
      },
      issue_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      paid_date: DataTypes.DATEONLY,
      notes: DataTypes.TEXT,
      payment_provider: DataTypes.STRING(50),
      payment_details: {
        type: DataTypes.BLOB, // BYTEA in PostgreSQL maps to BLOB in Sequelize
        comment: 'Encrypted. Contains sensitive payment information'
      },
      key_version: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      status_code: {
        type: DataTypes.STRING(20),
        defaultValue: 'draft'
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      sequelize,
      tableName: 'invoices',
      schema: 'billing',
      paranoid: true,
      comment: "Contains sensitive payment information that must be stored encrypted",
      validate: {
        dueDateAfterIssue() {
          if (this.due_date < this.issue_date) {
            throw new Error('Due date must be after issue date');
          }
        },
        statusValid() {
          if (!['draft', 'sent', 'paid', 'overdue', 'cancelled'].includes(this.status_code)) {
            throw new Error('Invalid status code');
          }
        }
      },
      indexes: [
        { fields: ['client_id'] },
        { fields: ['project_id'] },
        { fields: ['status_code'] },
        { fields: ['is_deleted'] },
        { fields: ['uuid'] },
        { 
          name: 'idx_invoices_created_at_brin',
          fields: ['created_at'],
          using: 'brin'
        },
        { 
          name: 'idx_invoices_metadata',
          fields: ['metadata'],
          using: 'gin'
        }
      ]
    });
  }

  static associate({ User, Project, InvoiceStatus, InvoiceItem }) {
    this.belongsTo(User, { 
      as: 'client',
      foreignKey: 'client_id'
    });
    this.belongsTo(Project, {
      foreignKey: 'project_id'
    });
    this.belongsTo(InvoiceStatus, { 
      foreignKey: 'status_code',
      targetKey: 'code'
    });
    this.hasMany(InvoiceItem);
  }
}; 