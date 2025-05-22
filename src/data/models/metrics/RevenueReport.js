const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class RevenueReport extends BaseModel {
  static init() {
    return super.init({
      report_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      period_type: {
        type: DataTypes.STRING(20),
        validate: {
          isIn: [['daily', 'weekly', 'monthly', 'quarterly', 'yearly']]
        }
      },
      total_revenue: {
        type: DataTypes.DECIMAL(15,2),
        allowNull: false
      },
      total_invoices: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      total_paid: {
        type: DataTypes.DECIMAL(15,2),
        allowNull: false
      },
      total_outstanding: {
        type: DataTypes.DECIMAL(15,2),
        allowNull: false
      },
      breakdown: {
        type: DataTypes.JSONB,
        defaultValue: null
      }
    }, {
      sequelize,
      tableName: 'revenue_reports',
      schema: 'metrics',
      timestamps: true,
      indexes: [
        { fields: ['report_date'] },
        { fields: ['period_type'] },
        { 
          name: 'idx_revenue_reports_breakdown',
          fields: ['breakdown'],
          using: 'gin'
        }
      ]
    });
  }
}; 