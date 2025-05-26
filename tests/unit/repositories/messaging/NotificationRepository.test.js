const { Op } = require('sequelize');
const NotificationRepository = require('../../../../src/data/repositories/messaging/NotificationRepository');
const { Notification } = require('../../../../src/data/models');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  Notification: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    update: jest.fn()
  }
}));

// Mock sequelize Op
jest.mock('sequelize', () => ({
  Op: {
    gt: Symbol('gt')
  }
}));

describe('NotificationRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new NotificationRepository();
    jest.clearAllMocks();
  });

  test('constructor should set the model correctly', () => {
    expect(repository.model).toBe(Notification);
  });

  test('findByUuid should call findOne with correct parameters', async () => {
    const uuid = 'notification-uuid-123';
    const mockNotification = { id: 1, uuid };
    Notification.findOne.mockResolvedValue(mockNotification);

    const result = await repository.findByUuid(uuid);
    
    expect(Notification.findOne).toHaveBeenCalledWith({ where: { uuid } });
    expect(result).toEqual(mockNotification);
  });

  test('getByUser should call findAndCountAll with correct parameters', async () => {
    const userId = 5;
    const limit = 20;
    const offset = 0;
    const mockResult = { 
      count: 30, 
      rows: [{ id: 1 }, { id: 2 }] 
    };
    Notification.findAndCountAll.mockResolvedValue(mockResult);

    const result = await repository.getByUser(userId, limit, offset);
    
    expect(Notification.findAndCountAll).toHaveBeenCalledWith({
      where: { 
        user_id: userId,
        is_deleted: false 
      },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    expect(result).toEqual(mockResult);
  });

  test('getUnreadByUser should call findAll with correct parameters', async () => {
    const userId = 5;
    const mockNotifications = [{ id: 1 }, { id: 2 }];
    Notification.findAll.mockResolvedValue(mockNotifications);

    const result = await repository.getUnreadByUser(userId);
    
    expect(Notification.findAll).toHaveBeenCalledWith({
      where: {
        user_id: userId,
        is_read: false,
        is_deleted: false
      },
      order: [['created_at', 'DESC']]
    });
    expect(result).toEqual(mockNotifications);
  });

  test('markAsRead should call update with correct parameters', async () => {
    const notificationId = 1;
    const userId = 5;
    const updateResult = [1]; // Number of affected rows
    Notification.update.mockResolvedValue(updateResult);
    
    // Mock Date for consistent testing
    const now = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => now);

    const result = await repository.markAsRead(notificationId, userId);
    
    expect(Notification.update).toHaveBeenCalledWith(
      { 
        is_read: true,
        read_at: now
      },
      {
        where: {
          id: notificationId,
          user_id: userId,
          is_deleted: false
        }
      }
    );
    expect(result).toEqual(updateResult);
    
    // Restore Date mock
    global.Date.mockRestore();
  });

  test('markAllAsRead should call update with correct parameters', async () => {
    const userId = 5;
    const updateResult = [5]; // Number of affected rows
    Notification.update.mockResolvedValue(updateResult);
    
    // Mock Date for consistent testing
    const now = new Date();
    jest.spyOn(global, 'Date').mockImplementation(() => now);

    const result = await repository.markAllAsRead(userId);
    
    expect(Notification.update).toHaveBeenCalledWith(
      { 
        is_read: true,
        read_at: now
      },
      {
        where: {
          user_id: userId,
          is_read: false,
          is_deleted: false
        }
      }
    );
    expect(result).toEqual(updateResult);
    
    // Restore Date mock
    global.Date.mockRestore();
  });

  test('getByType should call findAll with correct parameters', async () => {
    const userId = 5;
    const type = 'message';
    const mockNotifications = [{ id: 1 }, { id: 2 }];
    Notification.findAll.mockResolvedValue(mockNotifications);

    const result = await repository.getByType(userId, type);
    
    expect(Notification.findAll).toHaveBeenCalledWith({
      where: {
        user_id: userId,
        type,
        is_deleted: false
      },
      order: [['created_at', 'DESC']]
    });
    expect(result).toEqual(mockNotifications);
  });
}); 