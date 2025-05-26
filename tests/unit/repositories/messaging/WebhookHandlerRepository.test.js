const { Op } = require('sequelize');
const WebhookHandlerRepository = require('../../../../src/data/repositories/messaging/WebhookHandlerRepository');
const { WebhookHandler } = require('../../../../src/data/models');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  WebhookHandler: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn()
  }
}));

describe('WebhookHandlerRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new WebhookHandlerRepository();
    jest.clearAllMocks();
  });

  test('constructor should set the model correctly', () => {
    expect(repository.model).toBe(WebhookHandler);
  });

  test('getActiveHandlers should call findAll with correct parameters', async () => {
    const mockHandlers = [
      { id: 1, event_type: 'user.created', is_active: true, priority: 1 },
      { id: 2, event_type: 'payment.processed', is_active: true, priority: 2 }
    ];
    WebhookHandler.findAll.mockResolvedValue(mockHandlers);

    const result = await repository.getActiveHandlers();
    
    expect(WebhookHandler.findAll).toHaveBeenCalledWith({
      where: { is_active: true },
      order: [['priority', 'ASC']]
    });
    expect(result).toEqual(mockHandlers);
  });

  test('getByEventType should call findOne with correct parameters', async () => {
    const eventType = 'user.created';
    const mockHandler = { id: 1, event_type: eventType, is_active: true };
    WebhookHandler.findOne.mockResolvedValue(mockHandler);

    const result = await repository.getByEventType(eventType);
    
    expect(WebhookHandler.findOne).toHaveBeenCalledWith({
      where: { event_type: eventType }
    });
    expect(result).toEqual(mockHandler);
  });

  test('getActiveHandlersByEventType should call findAll with correct parameters', async () => {
    const eventType = 'user.created';
    const mockHandlers = [
      { id: 1, event_type: eventType, is_active: true, priority: 1 }
    ];
    WebhookHandler.findAll.mockResolvedValue(mockHandlers);

    const result = await repository.getActiveHandlersByEventType(eventType);
    
    expect(WebhookHandler.findAll).toHaveBeenCalledWith({
      where: {
        event_type: eventType,
        is_active: true
      },
      order: [['priority', 'ASC']]
    });
    expect(result).toEqual(mockHandlers);
  });

  test('toggleActive should call update with correct parameters', async () => {
    const eventType = 'user.created';
    const isActive = false;
    const updateResult = [1]; // Number of affected rows
    
    WebhookHandler.update.mockResolvedValue(updateResult);

    const result = await repository.toggleActive(eventType, isActive);
    
    expect(WebhookHandler.update).toHaveBeenCalledWith(
      { is_active: isActive },
      { where: { event_type: eventType } }
    );
    expect(result).toEqual(updateResult);
  });

  test('updatePriority should call update with correct parameters', async () => {
    const eventType = 'user.created';
    const priority = 5;
    const updateResult = [1]; // Number of affected rows
    
    WebhookHandler.update.mockResolvedValue(updateResult);

    const result = await repository.updatePriority(eventType, priority);
    
    expect(WebhookHandler.update).toHaveBeenCalledWith(
      { priority },
      { where: { event_type: eventType } }
    );
    expect(result).toEqual(updateResult);
  });
}); 