const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class ProjectMetric extends BaseModel {
  static init(sequelize) {
    return super.init({
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      metric_name: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      metric_value: {
        type: DataTypes.DECIMAL(15,2),
        allowNull: false
      },
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
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
      }
    }, {
      sequelize,
      tableName: 'project_metrics',
      schema: 'metrics',
      timestamps: true,
      indexes: [
        { fields: ['project_id'] },
        { fields: ['metric_name'] },
        { fields: ['period_start', 'period_end'] },
        { 
          name: 'idx_project_metrics_metadata',
          fields: ['metadata'],
          using: 'gin'
        },
        {
          name: 'idx_project_metrics_project_metric_period',
          fields: ['project_id', 'metric_name', 'period_start']
        }
      ]
    });
  }

  static associate({ Project }) {
    this.belongsTo(Project, { foreignKey: 'project_id' });
  }
};