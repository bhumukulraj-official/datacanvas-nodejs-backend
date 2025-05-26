const notificationService = require('../../../../src/services/messaging/notification.service');
const { NotificationRepository } = require('../../../../src/data/repositories/messaging');
const { CustomError } = require('../../../../src/utils/error.util');

// Mock the repository
jest.mock('../../../../src/data/repositories/messaging', () => ({
  NotificationRepository: jest.fn()
}));

describe('NotificationService', () => {
  let mockNotificationRepository;
  
  beforeEach(() => {
    // Create new instance of mocked repository
    mockNotificationRepository = new NotificationRepository();
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Mock repository on the service
    notificationService.notificationRepo = mockNotificationRepository;
  });

  describe('createNotification', () => {
    test('should create a notification successfully', async () => {
      const userId = 1;
      const type = 'message';
      const data = { conversationId: 123, senderId: 2, message: 'Hello!' };
      
      // Mock created notification
      const mockNotification = {
        id: 1,
        user_id: userId,
        type,
        data: JSON.stringify(data),
        is_read: false,
        created_at: new Date()
      };
      
      mockNotificationRepository.create = jest.fn().mockResolvedValue(mockNotification);
      
      // Call the service method
      const result = await notificationService.createNotification(userId, type, data);
      
      // Assertions
      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        user_id: userId,
        type,
        data: JSON.stringify(data),
        is_read: false
      });
      expect(result).toEqual(mockNotification);
    });
  });

  describe('getUserNotifications', () => {
    test('should return user notifications with default limit', async () => {
      const userId = 1;
      
      // Mock notifications
      const mockNotifications = [
        {
          id: 1,
          user_id: userId,
          type: 'message',
          data: JSON.stringify({ conversationId: 123 }),
          is_read: false,
          created_at: new Date()
        },
        {
          id: 2,
          user_id: userId,
          type: 'system',
          data: JSON.stringify({ message: 'System update' }),
          is_read: true,
          created_at: new Date(Date.now() - 3600000) // 1 hour ago
        }
      ];
      
      mockNotificationRepository.getByUser = jest.fn().mockResolvedValue(mockNotifications);
      
      // Call the service method
      const result = await notificationService.getUserNotifications(userId);
      
      // Assertions
      expect(mockNotificationRepository.getByUser).toHaveBeenCalledWith(userId, 20);
      expect(result).toEqual(mockNotifications);
    });
    
    test('should return user notifications with custom limit', async () => {
      const userId = 1;
      const limit = 5;
      
      // Mock notifications
      const mockNotifications = [
        {
          id: 1,
          user_id: userId,
          type: 'message',
          data: JSON.stringify({ conversationId: 123 }),
          is_read: false,
          created_at: new Date()
        }
      ];
      
      mockNotificationRepository.getByUser = jest.fn().mockResolvedValue(mockNotifications);
      
      // Call the service method
      const result = await notificationService.getUserNotifications(userId, limit);
      
      // Assertions
      expect(mockNotificationRepository.getByUser).toHaveBeenCalledWith(userId, limit);
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markAsRead', () => {
    test('should mark notification as read successfully', async () => {
      const notificationId = 1;
      const userId = 1;
      
      // Mock markAsRead to return 1 affected row
      mockNotificationRepository.markAsRead = jest.fn().mockResolvedValue([1]);
      
      // Call the service method
      const result = await notificationService.markAsRead(notificationId, userId);
      
      // Assertions
      expect(mockNotificationRepository.markAsRead).toHaveBeenCalledWith(notificationId, userId);
      expect(result).toBe(true);
    });
    
    test('should throw error if notification not found', async () => {
      const notificationId = 999;
      const userId = 1;
      
      // Mock markAsRead to return 0 affected rows (notification not found or not owned by user)
      mockNotificationRepository.markAsRead = jest.fn().mockResolvedValue([0]);
      
      // Call the service method and expect it to throw
      await expect(
        notificationService.markAsRead(notificationId, userId)
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockNotificationRepository.markAsRead).toHaveBeenCalledWith(notificationId, userId);
    });
  });

  describe('clearAllNotifications', () => {
    test('should mark all user notifications as read', async () => {
      const userId = 1;
      
      // Mock markAllAsRead to return 5 affected rows
      mockNotificationRepository.markAllAsRead = jest.fn().mockResolvedValue(5);
      
      // Call the service method
      const result = await notificationService.clearAllNotifications(userId);
      
      // Assertions
      expect(mockNotificationRepository.markAllAsRead).toHaveBeenCalledWith(userId);
      expect(result).toBe(5);
    });
  });
}); 