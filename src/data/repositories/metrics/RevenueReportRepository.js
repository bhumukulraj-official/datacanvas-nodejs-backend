const BaseRepository = require('../BaseRepository');
const { RevenueReport } = require('../../models');
const { Op } = require('sequelize');

class RevenueReportRepository extends BaseRepository {
  constructor() {
    super(RevenueReport);
  }

  async getLatestReport(periodType) {
    return this.model.findOne({
      where: { period_type: periodType },
      order: [['report_date', 'DESC']]
    });
  }

  async getReportsForPeriod(startDate, endDate) {
    return this.model.findAll({
      where: {
        report_date: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['report_date', 'ASC']]
    });
  }
}

module.exports = RevenueReportRepository; 