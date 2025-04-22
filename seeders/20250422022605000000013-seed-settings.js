'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('settings', [
      {
        site_name: 'DataCanvas',
        site_description: 'A professional portfolio and blog platform for developers and designers.',
        logo_url: 'https://example.com/images/datacanvas-logo.png',
        favicon_url: 'https://example.com/images/datacanvas-favicon.ico',
        theme: JSON.stringify({
          primaryColor: '#3498db',
          secondaryColor: '#2ecc71',
          textColor: '#333333',
          backgroundColor: '#ffffff',
          fontFamily: 'Roboto, sans-serif'
        }),
        contact_info: JSON.stringify({
          email: 'contact@datacanvas.com',
          phone: '+1 (555) 123-4567',
          address: '123 Tech Street, San Francisco, CA 94107'
        }),
        social_links: JSON.stringify({
          twitter: 'https://twitter.com/datacanvas',
          facebook: 'https://facebook.com/datacanvas',
          linkedin: 'https://linkedin.com/company/datacanvas',
          github: 'https://github.com/datacanvas'
        }),
        seo_settings: JSON.stringify({
          metaTitle: 'DataCanvas - Modern Web Development Platform',
          metaDescription: 'Build beautiful portfolios and blogs with DataCanvas',
          ogImage: 'https://example.com/images/datacanvas-og.png',
          keywords: 'portfolio, blog, developers, designers'
        }),
        analytics_settings: JSON.stringify({
          googleAnalyticsId: 'UA-12345678-1',
          enabledTracking: true,
          anonymizeIp: true
        }),
        theme_options: JSON.stringify({
          enableDarkMode: true,
          defaultTheme: 'light',
          navbarStyle: 'floating',
          footerStyle: 'minimal'
        }),
        privacy_settings: JSON.stringify({
          cookieConsentEnabled: true,
          privacyPolicyUrl: '/privacy',
          termsOfServiceUrl: '/terms',
          dataRetentionDays: 90
        }),
        notification_settings: JSON.stringify({
          emailNotificationsEnabled: true,
          digestEmailFrequency: 'weekly',
          pushNotificationsEnabled: false
        }),
        caching_settings: JSON.stringify({
          pageCacheTtl: 3600,
          assetCacheTtl: 86400,
          apiCacheTtl: 300
        }),
        security_settings: JSON.stringify({
          twoFactorAuthEnabled: true,
          passwordMinLength: 8,
          passwordRequireSpecialChars: true
        }),
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('settings', null, {});
  }
}; 