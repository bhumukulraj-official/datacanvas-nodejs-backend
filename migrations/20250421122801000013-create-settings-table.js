'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('settings', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      site_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      site_description: {
        type: Sequelize.TEXT,
      },
      logo_url: {
        type: Sequelize.STRING,
      },
      favicon_url: {
        type: Sequelize.STRING,
      },
      theme: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      contact_info: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      social_links: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      seo_settings: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      analytics_settings: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      theme_options: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      privacy_settings: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      notification_settings: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      caching_settings: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      security_settings: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('settings', ['site_name'], { name: 'idx_settings_site_name' });
    await queryInterface.addIndex('settings', ['created_at'], { name: 'idx_settings_created_at' });
    await queryInterface.addIndex('settings', ['updated_at'], { name: 'idx_settings_updated_at' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('settings');
  }
};
