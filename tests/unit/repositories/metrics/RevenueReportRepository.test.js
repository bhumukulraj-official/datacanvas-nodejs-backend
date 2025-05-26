const { Op } = require('sequelize');
const { RevenueReportRepository } = require('../../../../src/data/repositories/metrics');
const { RevenueReport } = require('../../../../src/data/models');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  RevenueReport: {
    findOne: jest.fn(),
    findAll: jest.fn()
  }
}));

// Mock sequelize Op
jest.mock('sequelize', () => ({
  Op: {
    between: Symbol('between')
  }
}));

// Mock the BaseRepository
jest.mock('../../../../src/data/repositories/BaseRepository', () => {
  return class MockBaseRepository {
    constructor(model) {
      this.model = model;
    }
  };
});

describe('RevenueReportRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new RevenueReportRepository();
    jest.clearAllMocks();
  });

  test('getLatestReport should call findOne with correct parameters', async () => {
    const periodType = 'monthly';
    const mockReport = { 
      id: 1, 
      period_type: periodType,
      report_date: new Date('2023-01-31')
    };
    
    RevenueReport.findOne.mockResolvedValue(mockReport);
    
    const result = await repository.getLatestReport(periodType);
    
    expect(RevenueReport.findOne).toHaveBeenCalledWith({
      where: { period_type: periodType },
      order: [['report_date', 'DESC']]
    });
    expect(result).toEqual(mockReport);
  });

  test('getReportsForPeriod should call findAll with correct parameters', async () => {
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-12-31');
    const mockReports = [
      { id: 1, report_date: new Date('2023-01-31') },
      { id: 2, report_date: new Date('2023-02-28') }
    ];
    
    RevenueReport.findAll.mockResolvedValue(mockReports);
    
    const result = await repository.getReportsForPeriod(startDate, endDate);
    
    expect(RevenueReport.findAll).toHaveBeenCalledWith({
      where: {
        report_date: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['report_date', 'ASC']]
    });
    expect(result).toEqual(mockReports);
  });
}); 