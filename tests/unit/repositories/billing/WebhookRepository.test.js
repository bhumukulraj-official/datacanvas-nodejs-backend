const { WebhookRepository } = require('../../../../src/data/repositories/billing');
const { Webhook } = require('../../../../src/data/models');
const { Op } = require('sequelize');

// Mock the models and sequelize operators
jest.mock('../../../../src/data/models', () => ({
  Webhook: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    sequelize: {
      literal: jest.fn(str => str)
    }
  }
}));

// Mock sequelize Op
jest.mock('sequelize', () => ({
  Op: {
    or: Symbol('or'),
    lte: Symbol('lte'),
    lt: Symbol('lt')
  }
}));

// Mock the BaseRepository
jest.mock('../../../../src/data/repositories/BaseRepository', () => {
  return class MockBaseRepository {
    constructor(model) {
      this.model = model;
    }
    
    async update(id, data) {
      return { id, ...data };
    }
  };
});

describe('WebhookRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new WebhookRepository();
    jest.clearAllMocks();
  });

  test('findByUuid should call findOne with correct parameters', async () => {
    const uuid = 'webhook-uuid-123';
    const mockWebhook = { id: 1, uuid };
    Webhook.findOne.mockResolvedValue(mockWebhook);
    
    const result = await repository.findByUuid(uuid);
    
    expect(Webhook.findOne).toHaveBeenCalledWith({ where: { uuid } });
    expect(result).toEqual(mockWebhook);
  });

  test('findByStatus should call findAll with correct parameters', async () => {
    const status = 'pending';
    const mockWebhooks = [
      { id: 1, status },
      { id: 2, status }
    ];
    Webhook.findAll.mockResolvedValue(mockWebhooks);
    
    const result = await repository.findByStatus(status);
    
    expect(Webhook.findAll).toHaveBeenCalledWith({ where: { status } });
    expect(result).toEqual(mockWebhooks);
  });

  test('findPendingWebhooks should call findAll with correct parameters', async () => {
    const mockWebhooks = [
      { id: 1, status: 'pending' },
      { id: 2, status: 'pending' }
    ];
    Webhook.findAll.mockResolvedValue(mockWebhooks);
    
    // Mock current date
    const now = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => now);
    
    const result = await repository.findPendingWebhooks();
    
    expect(Webhook.findAll).toHaveBeenCalledWith({
      where: {
        status: 'pending',
        [Op.or]: [
          { next_retry_at: null },
          { next_retry_at: { [Op.lte]: now } }
        ]
      },
      order: [['created_at', 'ASC']]
    });
    expect(result).toEqual(mockWebhooks);
    
    global.Date.mockRestore();
  });

  test('incrementAttempt should call update with correct parameters', async () => {
    const webhookId = 1;
    
    // Mock Webhook.sequelize.literal
    Webhook.sequelize.literal.mockReturnValue('attempts + 1');
    
    // Mock the update method
    repository.update = jest.fn().mockResolvedValue({ 
      id: webhookId,
      attempts: 'attempts + 1'
    });
    
    const result = await repository.incrementAttempt(webhookId);
    
    expect(Webhook.sequelize.literal).toHaveBeenCalledWith('attempts + 1');
    expect(repository.update).toHaveBeenCalledWith(webhookId, {
      attempts: 'attempts + 1'
    });
    expect(result).toEqual({ 
      id: webhookId,
      attempts: 'attempts + 1'
    });
  });

  test('incrementAttempt should include next_retry_at if provided', async () => {
    const webhookId = 1;
    const nextRetryAt = new Date();
    
    // Mock Webhook.sequelize.literal
    Webhook.sequelize.literal.mockReturnValue('attempts + 1');
    
    // Mock the update method
    repository.update = jest.fn().mockResolvedValue({ 
      id: webhookId,
      attempts: 'attempts + 1',
      next_retry_at: nextRetryAt
    });
    
    const result = await repository.incrementAttempt(webhookId, nextRetryAt);
    
    expect(repository.update).toHaveBeenCalledWith(webhookId, {
      attempts: 'attempts + 1',
      next_retry_at: nextRetryAt
    });
    expect(result).toEqual({ 
      id: webhookId,
      attempts: 'attempts + 1',
      next_retry_at: nextRetryAt
    });
  });

  test('updateStatus should call update with correct parameters', async () => {
    const webhookId = 1;
    const status = 'completed';
    
    // Mock the update method
    repository.update = jest.fn().mockResolvedValue({ 
      id: webhookId,
      status
    });
    
    const result = await repository.updateStatus(webhookId, status);
    
    expect(repository.update).toHaveBeenCalledWith(webhookId, { status });
    expect(result).toEqual({ 
      id: webhookId,
      status
    });
  });
}); 