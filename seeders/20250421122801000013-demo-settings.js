'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const settings = [
      {
        site_name: 'DataCanvas',
        site_description: 'A modern portfolio and blog platform',
        logo_url: 'https://example.com/logo.png',
        favicon_url: 'https://example.com/favicon.ico',
        theme: JSON.stringify({
          primary_color: '#007bff',
          secondary_color: '#6c757d',
          font_family: 'Inter, sans-serif'
        }),
        contact_info: JSON.stringify({
          email: 'contact@datacanvas.com',
          phone: '+1234567890',
          address: '123 Tech Street, Silicon Valley, CA'
        }),
        social_links: JSON.stringify({
          github: 'https://github.com/datacanvas',
          twitter: 'https://twitter.com/datacanvas',
          linkedin: 'https://linkedin.com/company/datacanvas'
        }),
        seo_settings: JSON.stringify({
          meta_description: 'DataCanvas - A modern portfolio and blog platform',
          meta_keywords: 'portfolio, blog, web development',
          og_image: 'https://example.com/og-image.jpg'
        }),
        analytics_settings: JSON.stringify({
          google_analytics_id: 'UA-XXXXXXXX-X',
          enable_tracking: true
        }),
        theme_options: JSON.stringify({
          dark_mode: true,
          rtl_support: false
        }),
        privacy_settings: JSON.stringify({
          cookie_consent: true,
          data_retention_days: 90
        }),
        notification_settings: JSON.stringify({
          email_notifications: true,
          push_notifications: false
        }),
        caching_settings: JSON.stringify({
          enable_cache: true,
          cache_duration: 3600
        }),
        security_settings: JSON.stringify({
          max_login_attempts: 5,
          password_expiry_days: 90
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('settings', settings, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('settings', null, {});
  }
}; 