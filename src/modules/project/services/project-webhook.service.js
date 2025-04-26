const axios = require('axios');
const { redisGet, redisSet } = require('../../../shared/database');

/**
 * Get all registered webhook URLs for project events
 * @returns {Promise<string[]>} Array of webhook URLs
 */
exports.getWebhookUrls = async () => {
  const cacheKey = 'webhooks:projects';
  const cachedUrls = await redisGet(cacheKey);
  
  if (cachedUrls) {
    return JSON.parse(cachedUrls);
  }
  
  // Default to empty array if no URLs exist
  // In a real implementation, this would load from a webhooks table
  return [];
};

/**
 * Register a new webhook URL for project events
 * @param {string} url Webhook URL
 * @returns {Promise<boolean>} Success status
 */
exports.registerWebhook = async (url) => {
  try {
    const urls = await exports.getWebhookUrls();
    
    // Avoid duplicates
    if (!urls.includes(url)) {
      urls.push(url);
      await redisSet('webhooks:projects', JSON.stringify(urls));
    }
    
    return true;
  } catch (error) {
    console.error('Error registering webhook:', error);
    return false;
  }
};

/**
 * Unregister a webhook URL for project events
 * @param {string} url Webhook URL to remove
 * @returns {Promise<boolean>} Success status
 */
exports.unregisterWebhook = async (url) => {
  try {
    const urls = await exports.getWebhookUrls();
    const filtered = urls.filter(u => u !== url);
    
    await redisSet('webhooks:projects', JSON.stringify(filtered));
    
    return true;
  } catch (error) {
    console.error('Error unregistering webhook:', error);
    return false;
  }
};

/**
 * Notify all registered webhooks about a project event
 * @param {string} event Event type (created, updated, deleted, etc.)
 * @param {Object} project Project data
 * @returns {Promise<void>}
 */
exports.notifyWebhooks = async (event, project) => {
  try {
    const urls = await exports.getWebhookUrls();
    if (!urls.length) return;
    
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      project: {
        id: project.id,
        title: project.title,
        slug: project.slug,
        status: project.status,
        user_id: project.user_id,
        created_at: project.created_at,
        updated_at: project.updated_at
      }
    };
    
    // Send notifications in parallel
    const requests = urls.map(url => 
      axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      })
      .catch(error => {
        console.error(`Webhook notification to ${url} failed:`, error.message);
        return null; // Don't fail if one webhook fails
      })
    );
    
    await Promise.all(requests);
  } catch (error) {
    console.error('Error notifying webhooks:', error);
  }
}; 