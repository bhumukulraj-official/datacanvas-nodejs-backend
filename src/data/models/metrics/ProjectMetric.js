const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class ProjectMetric extends BaseModel {
  static init() {
    return super.init({
      metric_name: DataTypes.STRING(50),
      metric_value: DataTypes.DECIMAL(15,2),
      period_start: {
        type: DataTypes.DATEONLY,
        validate: { isDate: true }
      },
      period_end: {
        type: DataTypes.DATEONLY,
        validate: {
          isDate: true,
          isAfterStart(value) {
            if (this.period_start && value < this.period_start) {
              throw new Error('Period end must be after period start');
            }
          }
        }
      },
      metadata: DataTypes.JSONB
    }, {
      sequelize,
      tableName: 'project_metrics',
      schema: 'metrics',
      indexes: [
        { fields: ['project_id'] },
        { fields: ['metric_name'] },
        { fields: ['period_start', 'period_end'] },
        { 
          name: 'idx_project_metrics_metadata',
          fields: ['metadata'],
          using: 'gin'
        }
      ]
    });
  }

  static associate({ Project }) {
    this.belongsTo(Project);
  }
};