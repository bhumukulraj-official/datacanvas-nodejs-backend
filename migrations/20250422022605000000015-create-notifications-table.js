'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notifications', {
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
      type: {
        type: 'notification_type',
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      priority: {
        type: 'notification_priority',
        defaultValue: 'medium',
        allowNull: false,
      },
      status: {
        type: 'notification_status',
        defaultValue: 'unread',
        allowNull: false,
      },
      metadata: {
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
    await queryInterface.addIndex('notifications', ["user_id"], { 
      name: 'idx_notifications_user_id',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('notifications', ["read"], { 
      name: 'idx_notifications_read',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('notifications', ["category"], { 
      name: 'idx_notifications_category',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('notifications', ["priority"], { 
      name: 'idx_notifications_priority',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('notifications', ["status"], { 
      name: 'idx_notifications_status',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('notifications', ["deleted_at"], { 
      name: 'idx_notifications_deleted_at' 
    });

    // Add constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE notifications
      ADD CONSTRAINT check_title_length
      CHECK (char_length(title) >= 2 AND char_length(title) <= 100);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notifications');
  }
};
