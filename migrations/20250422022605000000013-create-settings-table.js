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
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      site_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      logo_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      favicon_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
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
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      }
    });

    // Add indexes
    await queryInterface.addIndex('settings', ['site_name'], { 
      name: 'idx_settings_site_name',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('settings', ['created_at'], { 
      name: 'idx_settings_created_at' 
    });
    
    await queryInterface.addIndex('settings', ['updated_at'], { 
      name: 'idx_settings_updated_at' 
    });
    
    await queryInterface.addIndex('settings', ['deleted_at'], { 
      name: 'idx_settings_deleted_at' 
    });

    // Add constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE settings
      ADD CONSTRAINT check_site_name_length
      CHECK (char_length(site_name) >= 2 AND char_length(site_name) <= 100);
      
      ALTER TABLE settings
      ADD CONSTRAINT check_url_format
      CHECK (
        (logo_url IS NULL OR logo_url ~* '^https?://[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\\.[a-zA-Z]{2,}(?:\\.[a-zA-Z]{2,})?(/.*)?$')
        AND
        (favicon_url IS NULL OR favicon_url ~* '^https?://[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\\.[a-zA-Z]{2,}(?:\\.[a-zA-Z]{2,})?(/.*)?$')
      );
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('settings');
  }
};
