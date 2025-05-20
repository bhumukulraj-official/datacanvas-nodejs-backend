const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class Invoice extends BaseModel {
  static init() {
    return super.init({
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4
      },
      invoice_number: {
        type: DataTypes.STRING(50),
        unique: true
      },
      amount: {
        type: DataTypes.DECIMAL(10,2),
        validate: { min: 0 }
      },
      tax: {
        type: DataTypes.DECIMAL(10,2),
        defaultValue: 0,
        validate: { min: 0 }
      },
      issue_date: DataTypes.DATEONLY,
      due_date: DataTypes.DATEONLY,
      paid_date: DataTypes.DATEONLY,
      notes: DataTypes.TEXT,
      payment_provider: DataTypes.STRING(50),
      payment_details: {
        type: DataTypes.JSONB,
        comment: 'Encrypted. Contains sensitive payment information'
      },
      metadata: DataTypes.JSONB,
      status_code: DataTypes.STRING(20),
      validate: {
        dueDateAfterIssue() {
          if (this.due_date < this.issue_date) {
            throw new Error('Due date must be after issue date');
          }
        },
        statusValid() {
          if (!['draft', 'sent', 'paid'].includes(this.status_code)) {
            throw new Error('Invalid status code');
          }
        }
      }
    }, {
      sequelize,
      tableName: 'invoices',
      schema: 'billing',
      paranoid: true,
      comment: "Contains sensitive payment information that must be stored encrypted",
      indexes: [
        { 
          name: 'idx_invoices_created_at_brin',
          fields: [sequelize.literal('created_at')],
          using: 'brin'
        },
        { 
          name: 'idx_invoices_payment_details',
          fields: ['payment_details'],
          using: 'gin'
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