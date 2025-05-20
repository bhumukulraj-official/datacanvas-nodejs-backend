const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class RevenueReport extends BaseModel {
  static init() {
    return super.init({
      report_date: DataTypes.DATEONLY,
      period_type: {
        type: DataTypes.STRING(20),
        validate: {
          isIn: [['daily', 'weekly', 'monthly', 'quarterly', 'yearly']]
        }
      },
      total_revenue: DataTypes.DECIMAL(15,2),
      total_invoices: DataTypes.INTEGER,
      total_paid: DataTypes.DECIMAL(15,2),
      total_outstanding: DataTypes.DECIMAL(15,2),
      breakdown: DataTypes.JSONB
    }, {
      sequelize,
      tableName: 'revenue_reports',
      schema: 'metrics',
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