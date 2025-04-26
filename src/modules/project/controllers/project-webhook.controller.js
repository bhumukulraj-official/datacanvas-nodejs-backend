const webhookService = require('../services/project-webhook.service');
const { ValidationError } = require('../../../shared/errors');

/**
 * Register a new webhook endpoint
 */
exports.registerWebhook = async (req, res, next) => {
  try {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string' || !url.match(/^https?:\/\/.+/)) {
      throw new ValidationError('Invalid webhook URL');
    }
    
    const success = await webhookService.registerWebhook(url);
    
    return res.status(200).json({
      success: true,
      data: { registered: success },
      message: 'Webhook registered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unregister a webhook endpoint
 */
exports.unregisterWebhook = async (req, res, next) => {
  try {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string') {
      throw new ValidationError('Invalid webhook URL');
    }
    
    const success = await webhookService.unregisterWebhook(url);
    
    return res.status(200).json({
      success: true,
      data: { unregistered: success },
      message: 'Webhook unregistered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all registered webhooks
 */
exports.listWebhooks = async (req, res, next) => {
  try {
    // This would typically come from the webhook service
    // For now, we use a placeholder method
    const urls = await webhookService.getWebhookUrls();
    
    return res.status(200).json({
      success: true,
      data: { webhooks: urls },
      message: 'Webhooks retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Test a webhook by sending a test payload
 */
exports.testWebhook = async (req, res, next) => {
  try {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string' || !url.match(/^https?:\/\/.+/)) {
      throw new ValidationError('Invalid webhook URL');
    }
    
    // Create a test project object
    const testProject = {
      id: 0,
      title: 'Test Project',
      slug: 'test-project',
      status: 'draft',
      user_id: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Send a test notification to this specific URL
    await webhookService.notifyWebhooks('test', testProject);
    
    return res.status(200).json({
      success: true,
      message: 'Test webhook sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}; 