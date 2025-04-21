'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('media', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      url: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      type: {
        type: 'media_type',
        allowNull: false,
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      filename: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      visibility: {
        type: Sequelize.STRING(20),
        defaultValue: 'public',
        allowNull: false,
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      status: {
        type: 'media_status',
        defaultValue: 'ready',
        allowNull: false,
      },
      optimized_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      optimized_size: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      optimization_metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      thumbnail_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      uploaded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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
    await queryInterface.addIndex('media', ["user_id"], { 
      name: 'idx_media_user_id',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('media', ["type"], { 
      name: 'idx_media_type',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('media', ["visibility"], { 
      name: 'idx_media_visibility',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('media', ["status"], { 
      name: 'idx_media_status',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('media', ["deleted_at"], { 
      name: 'idx_media_deleted_at' 
    });

    // Add constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE media
      ADD CONSTRAINT check_url_format
      CHECK (url ~* '^https?://[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\\.[a-zA-Z]{2,}(?:\\.[a-zA-Z]{2,})?$');
      
      ALTER TABLE media
      ADD CONSTRAINT check_filename_length
      CHECK (filename IS NULL OR char_length(filename) <= 255);
      
      ALTER TABLE media
      ADD CONSTRAINT check_visibility_values
      CHECK (visibility IN ('public', 'private', 'restricted'));
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('media');
  }
};
