const { Op } = require('sequelize');
const { ProjectMetricRepository } = require('../../../../src/data/repositories/metrics');
const { ProjectMetric } = require('../../../../src/data/models');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  ProjectMetric: {
    findAll: jest.fn()
  }
}));

// Mock sequelize Op
jest.mock('sequelize', () => ({
  Op: {
    gte: Symbol('gte'),
    lte: Symbol('lte'),
    gt: Symbol('gt')
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

describe('ProjectMetricRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new ProjectMetricRepository();
    jest.clearAllMocks();
  });

  test('getMetricsForPeriod should call findAll with correct parameters', async () => {
    const projectId = 5;
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-01-31');
    const mockMetrics = [
      { id: 1, project_id: projectId, metric_name: 'visits' },
      { id: 2, project_id: projectId, metric_name: 'downloads' }
    ];
    
    ProjectMetric.findAll.mockResolvedValue(mockMetrics);
    
    const result = await repository.getMetricsForPeriod(projectId, startDate, endDate);
    
    expect(ProjectMetric.findAll).toHaveBeenCalledWith({
      where: {
        project_id: projectId,
        period_start: { [Op.gte]: startDate },
        period_end: { [Op.lte]: endDate }
      }
    });
    expect(result).toEqual(mockMetrics);
  });

  test('getMetricsByName should call findAll with correct parameters', async () => {
    const metricName = 'visits';
    const mockMetrics = [
      { id: 1, metric_name: metricName },
      { id: 2, metric_name: metricName }
    ];
    
    ProjectMetric.findAll.mockResolvedValue(mockMetrics);
    
    const result = await repository.getMetricsByName(metricName);
    
    expect(ProjectMetric.findAll).toHaveBeenCalledWith({
      where: { metric_name: metricName }
    });
    expect(result).toEqual(mockMetrics);
  });

  test('getMetricsAboveValue should call findAll with correct parameters', async () => {
    const minValue = 100;
    const mockMetrics = [
      { id: 1, metric_value: 150 },
      { id: 2, metric_value: 200 }
    ];
    
    ProjectMetric.findAll.mockResolvedValue(mockMetrics);
    
    const result = await repository.getMetricsAboveValue(minValue);
    
    expect(ProjectMetric.findAll).toHaveBeenCalledWith({
      where: {
        metric_value: {
          [Op.gt]: minValue
        }
      }
    });
    expect(result).toEqual(mockMetrics);
  });
}); 