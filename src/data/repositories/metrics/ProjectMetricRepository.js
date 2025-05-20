const BaseRepository = require('../BaseRepository');
const { ProjectMetric } = require('../../models');
const { Op } = require('sequelize');

class ProjectMetricRepository extends BaseRepository {
  constructor() {
    super(ProjectMetric);
  }

  async getMetricsForPeriod(projectId, startDate, endDate) {
    return this.model.findAll({
      where: {
        project_id: projectId,
        period_start: { [Op.gte]: startDate },
        period_end: { [Op.lte]: endDate }
      }
    });
  }

  async getMetricsByName(metricName) {
    return this.model.findAll({
      where: { metric_name: metricName }
    });
  }

  async getMetricsAboveValue(minValue) {
    return this.model.findAll({
      where: {
        metric_value: {
          [Op.gt]: minValue
        }
      }
    });
  }
}

module.exports = ProjectMetricRepository; 