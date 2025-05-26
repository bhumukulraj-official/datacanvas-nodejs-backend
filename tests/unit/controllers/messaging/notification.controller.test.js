const notificationController = require('../../../../src/api/controllers/messaging/notification.controller');
const { NotificationService } = require('../../../../src/services/messaging');

// Mock the NotificationService
jest.mock('../../../../src/services/messaging/notification.service', () => ({
  getUserNotifications: jest.fn(),
  markAsRead: jest.fn(),
  clearAllNotifications: jest.fn()
}));

describe('NotificationController', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  
  beforeEach(() => {
    // Mock request, response, and next
    mockReq = {
      user: { id: 'user-123' },
      params: {
        notificationId: 'notification-123'
      },
      query: {
        limit: 10
      }
    };
    
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    test('should get user notifications', async () => {
      const mockNotifications = [
        { id: 'notification-1', message: 'New message', user_id: 'user-123' },
        { id: 'notification-2', message: 'New comment', user_id: 'user-123' }
      ];
      
      // Mock the getUserNotifications service method
      NotificationService.getUserNotifications.mockResolvedValue(mockNotifications);
      
      await notificationController.getNotifications(mockReq, mockRes, mockNext);
      
      expect(NotificationService.getUserNotifications).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.query.limit
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotifications
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to get notifications');
      
      // Mock the getUserNotifications service method to throw an error
      NotificationService.getUserNotifications.mockRejectedValue(mockError);
      
      await notificationController.getNotifications(mockReq, mockRes, mockNext);
      
      expect(NotificationService.getUserNotifications).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.query.limit
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('markAsRead', () => {
    test('should mark notification as read', async () => {
      // Mock the markAsRead service method
      NotificationService.markAsRead.mockResolvedValue(undefined);
      
      await notificationController.markAsRead(mockReq, mockRes, mockNext);
      
      expect(NotificationService.markAsRead).toHaveBeenCalledWith(
        mockReq.params.notificationId,
        mockReq.user.id
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to mark as read');
      
      // Mock the markAsRead service method to throw an error
      NotificationService.markAsRead.mockRejectedValue(mockError);
      
      await notificationController.markAsRead(mockReq, mockRes, mockNext);
      
      expect(NotificationService.markAsRead).toHaveBeenCalledWith(
        mockReq.params.notificationId,
        mockReq.user.id
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('clearNotifications', () => {
    test('should clear all notifications', async () => {
      // Mock the clearAllNotifications service method
      NotificationService.clearAllNotifications.mockResolvedValue(undefined);
      
      await notificationController.clearNotifications(mockReq, mockRes, mockNext);
      
      expect(NotificationService.clearAllNotifications).toHaveBeenCalledWith(
        mockReq.user.id
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to clear notifications');
      
      // Mock the clearAllNotifications service method to throw an error
      NotificationService.clearAllNotifications.mockRejectedValue(mockError);
      
      await notificationController.clearNotifications(mockReq, mockRes, mockNext);
      
      expect(NotificationService.clearAllNotifications).toHaveBeenCalledWith(
        mockReq.user.id
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
}); 