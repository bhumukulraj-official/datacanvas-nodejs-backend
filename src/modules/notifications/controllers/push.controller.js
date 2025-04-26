const pushService = require('../services/push.service');
const logger = require('../../../shared/utils/logger');

/**
 * Save a push subscription for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const saveSubscription = async (req, res) => {
  try {
    const { subscription, deviceInfo } = req.body;
    const userId = req.user.id;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid subscription data'
      });
    }
    
    const result = await pushService.saveSubscription(userId, subscription, deviceInfo);
    
    return res.status(201).json({
      status: 'success',
      data: {
        subscription: {
          id: result.id,
          endpoint: result.endpoint,
          createdAt: result.created_at
        }
      }
    });
  } catch (error) {
    logger.error('Error saving push subscription', {
      error: error.message,
      userId: req.user?.id
    });
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to save push subscription',
      error: error.message
    });
  }
};

/**
 * Delete a push subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteSubscription = async (req, res) => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({
        status: 'error',
        message: 'Subscription endpoint is required'
      });
    }
    
    const result = await pushService.deleteSubscription(endpoint);
    
    return res.status(200).json({
      status: 'success',
      data: {
        deleted: result
      }
    });
  } catch (error) {
    logger.error('Error deleting push subscription', {
      error: error.message,
      userId: req.user?.id
    });
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete push subscription',
      error: error.message
    });
  }
};

/**
 * Get all active push subscriptions for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const subscriptions = await pushService.getUserSubscriptions(userId);
    
    return res.status(200).json({
      status: 'success',
      data: {
        subscriptions: subscriptions.map(sub => ({
          id: sub.id,
          endpoint: sub.endpoint,
          deviceType: sub.device_type,
          createdAt: sub.created_at,
          updatedAt: sub.updated_at
        }))
      }
    });
  } catch (error) {
    logger.error('Error getting user push subscriptions', {
      error: error.message,
      userId: req.user?.id
    });
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get push subscriptions',
      error: error.message
    });
  }
};

/**
 * Get the VAPID public key for web push
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getVapidPublicKey = async (req, res) => {
  try {
    const publicKey = pushService.getVapidPublicKey();
    
    if (!publicKey) {
      return res.status(503).json({
        status: 'error',
        message: 'Push notifications are not currently enabled',
        code: 'PUSH_001'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        publicKey
      }
    });
  } catch (error) {
    logger.error('Error getting VAPID public key', {
      error: error.message
    });
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get VAPID public key',
      error: error.message
    });
  }
};

module.exports = {
  saveSubscription,
  deleteSubscription,
  getUserSubscriptions,
  getVapidPublicKey
}; 