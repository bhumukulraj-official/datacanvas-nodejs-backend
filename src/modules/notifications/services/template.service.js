const logger = require('../../../shared/utils/logger');

// Base templates for different notification types
const TEMPLATES = {
  system: {
    email: {
      subject: '{{title}}',
      text: `{{message}}

This is a system notification from DataCanvas.`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8f9fa; padding: 20px; border-bottom: 3px solid #007bff;">
    <h2 style="color: #007bff; margin: 0;">{{title}}</h2>
  </div>
  <div style="padding: 20px;">
    <p>{{message}}</p>
    <p style="font-size: 14px; color: #6c757d;">This is a system notification from DataCanvas.</p>
  </div>
</div>`,
    },
    push: {
      title: '{{title}}',
      body: '{{message}}',
      icon: '/icons/system-notification.png',
      url: '/',
    }
  },
  security: {
    email: {
      subject: 'Security Alert: {{title}}',
      text: `{{message}}

This is a security notification from DataCanvas.
If you didn't initiate this action, please secure your account immediately.`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8f9fa; padding: 20px; border-bottom: 3px solid #dc3545;">
    <h2 style="color: #dc3545; margin: 0;">Security Alert: {{title}}</h2>
  </div>
  <div style="padding: 20px;">
    <p>{{message}}</p>
    <p style="font-size: 14px; color: #6c757d;">This is a security notification from DataCanvas.</p>
    <p style="font-size: 14px; color: #dc3545;"><strong>If you didn't initiate this action, please secure your account immediately.</strong></p>
  </div>
</div>`,
    },
    push: {
      title: 'Security Alert: {{title}}',
      body: '{{message}}',
      icon: '/icons/security-alert.png',
      url: '/account/security',
    }
  },
  account: {
    email: {
      subject: 'Account Update: {{title}}',
      text: `{{message}}

This is an account notification from DataCanvas.`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8f9fa; padding: 20px; border-bottom: 3px solid #17a2b8;">
    <h2 style="color: #17a2b8; margin: 0;">Account Update: {{title}}</h2>
  </div>
  <div style="padding: 20px;">
    <p>{{message}}</p>
    <p style="font-size: 14px; color: #6c757d;">This is an account notification from DataCanvas.</p>
  </div>
</div>`,
    },
    push: {
      title: 'Account: {{title}}',
      body: '{{message}}',
      icon: '/icons/account-notification.png',
      url: '/account/settings',
    }
  },
  billing: {
    email: {
      subject: 'Billing Alert: {{title}}',
      text: `{{message}}

This is a billing notification from DataCanvas.`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8f9fa; padding: 20px; border-bottom: 3px solid #ffc107;">
    <h2 style="color: #ffc107; margin: 0;">Billing Alert: {{title}}</h2>
  </div>
  <div style="padding: 20px;">
    <p>{{message}}</p>
    <p style="font-size: 14px; color: #6c757d;">This is a billing notification from DataCanvas.</p>
  </div>
</div>`,
    },
    push: {
      title: 'Billing: {{title}}',
      body: '{{message}}',
      icon: '/icons/billing-notification.png',
      url: '/account/billing',
    }
  },
  project: {
    email: {
      subject: 'Project Update: {{title}}',
      text: `{{message}}

This is a project notification from DataCanvas.`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8f9fa; padding: 20px; border-bottom: 3px solid #28a745;">
    <h2 style="color: #28a745; margin: 0;">Project Update: {{title}}</h2>
  </div>
  <div style="padding: 20px;">
    <p>{{message}}</p>
    <p style="font-size: 14px; color: #6c757d;">This is a project notification from DataCanvas.</p>
  </div>
</div>`,
    },
    push: {
      title: 'Project: {{title}}',
      body: '{{message}}',
      icon: '/icons/project-notification.png',
      url: '/projects',
    }
  },
  social: {
    email: {
      subject: 'Social Update: {{title}}',
      text: `{{message}}

This is a social notification from DataCanvas.`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8f9fa; padding: 20px; border-bottom: 3px solid #fd7e14;">
    <h2 style="color: #fd7e14; margin: 0;">Social Update: {{title}}</h2>
  </div>
  <div style="padding: 20px;">
    <p>{{message}}</p>
    <p style="font-size: 14px; color: #6c757d;">This is a social notification from DataCanvas.</p>
  </div>
</div>`,
    },
    push: {
      title: 'Social: {{title}}',
      body: '{{message}}',
      icon: '/icons/social-notification.png',
      url: '/social',
    }
  },
  content: {
    email: {
      subject: 'Content Update: {{title}}',
      text: `{{message}}

This is a content notification from DataCanvas.`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8f9fa; padding: 20px; border-bottom: 3px solid #6f42c1;">
    <h2 style="color: #6f42c1; margin: 0;">Content Update: {{title}}</h2>
  </div>
  <div style="padding: 20px;">
    <p>{{message}}</p>
    <p style="font-size: 14px; color: #6c757d;">This is a content notification from DataCanvas.</p>
  </div>
</div>`,
    },
    push: {
      title: 'Content: {{title}}',
      body: '{{message}}',
      icon: '/icons/content-notification.png',
      url: '/content',
    }
  },
};

// Default template for notification types without specific templates
const DEFAULT_TEMPLATE = {
  email: {
    subject: 'Notification: {{title}}',
    text: `{{message}}

This is a notification from DataCanvas.`,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8f9fa; padding: 20px; border-bottom: 3px solid #6c757d;">
    <h2 style="color: #6c757d; margin: 0;">{{title}}</h2>
  </div>
  <div style="padding: 20px;">
    <p>{{message}}</p>
    <p style="font-size: 14px; color: #6c757d;">This is a notification from DataCanvas.</p>
  </div>
</div>`,
  },
  push: {
    title: '{{title}}',
    body: '{{message}}',
    icon: '/icons/default-notification.png',
    url: '/',
  }
};

/**
 * Get template for notification by type and channel
 * @param {String} type - Notification type
 * @param {String} channel - Notification channel (email, sms, push)
 * @returns {Object} Template object
 */
const getTemplate = (type, channel) => {
  try {
    // Get template for notification type
    const template = TEMPLATES[type]?.[channel] || DEFAULT_TEMPLATE[channel];
    
    if (!template) {
      logger.warn(`No template found for notification type '${type}' and channel '${channel}'`);
      return DEFAULT_TEMPLATE[channel] || DEFAULT_TEMPLATE.email;
    }
    
    return template;
  } catch (error) {
    logger.error('Error getting notification template', {
      error: error.message,
      type,
      channel,
    });
    
    // Fallback to default template
    return DEFAULT_TEMPLATE[channel] || DEFAULT_TEMPLATE.email;
  }
};

/**
 * Apply template to notification data
 * @param {Object} template - Template object
 * @param {Object} data - Notification data
 * @returns {Object} Formatted notification content
 */
const applyTemplate = (template, data) => {
  try {
    const result = {};
    
    // Apply template to each field
    Object.keys(template).forEach(key => {
      let content = template[key];
      
      // Replace placeholders with data
      Object.keys(data).forEach(dataKey => {
        const regex = new RegExp(`{{${dataKey}}}`, 'g');
        content = content.replace(regex, data[dataKey]);
      });
      
      result[key] = content;
    });
    
    return result;
  } catch (error) {
    logger.error('Error applying notification template', {
      error: error.message,
    });
    
    // Return original template as fallback
    return template;
  }
};

/**
 * Format notification for a specific channel
 * @param {Object} notification - Notification object
 * @param {String} channel - Notification channel (email, sms, push)
 * @returns {Object} Formatted notification
 */
const formatNotification = (notification, channel) => {
  try {
    const { type, title, message, metadata = {} } = notification;
    
    // Get template
    const template = getTemplate(type, channel);
    
    // Prepare data for template
    const data = {
      title,
      message,
      ...metadata,
    };
    
    // Add custom URL if specified in metadata
    if (channel === 'push' && metadata.url) {
      data.url = metadata.url;
    }
    
    // Apply template
    return applyTemplate(template, data);
  } catch (error) {
    logger.error('Error formatting notification', {
      error: error.message,
      notificationId: notification.id,
      channel,
    });
    
    // Fallback to basic formatting based on channel
    if (channel === 'push') {
      return {
        title: notification.title,
        body: notification.message,
        icon: '/icons/default-notification.png',
        url: '/',
      };
    }
    
    return {
      subject: notification.title,
      text: notification.message,
      html: `<p>${notification.message}</p>`,
    };
  }
};

/**
 * Get available templates
 * @returns {Object} Available templates by type and channel
 */
const getAvailableTemplates = () => {
  const templates = {};
  
  // Extract template types and channels
  Object.keys(TEMPLATES).forEach(type => {
    templates[type] = {};
    Object.keys(TEMPLATES[type]).forEach(channel => {
      templates[type][channel] = Object.keys(TEMPLATES[type][channel]);
    });
  });
  
  return templates;
};

module.exports = {
  getTemplate,
  applyTemplate,
  formatNotification,
  getAvailableTemplates,
}; 