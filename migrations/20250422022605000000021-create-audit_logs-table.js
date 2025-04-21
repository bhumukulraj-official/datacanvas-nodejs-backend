'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      entity_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      user_agent: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('audit_logs', ['user_id'], { 
      name: 'idx_audit_logs_user_id' 
    });
    
    await queryInterface.addIndex('audit_logs', ['action'], { 
      name: 'idx_audit_logs_action' 
    });
    
    await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id'], { 
      name: 'idx_audit_logs_entity' 
    });
    
    await queryInterface.addIndex('audit_logs', ['created_at'], { 
      name: 'idx_audit_logs_created_at' 
    });

    // Add constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE audit_logs
      ADD CONSTRAINT check_action_length
      CHECK (char_length(action) >= 2 AND char_length(action) <= 100);
      
      ALTER TABLE audit_logs
      ADD CONSTRAINT check_entity_type_length
      CHECK (entity_type IS NULL OR char_length(entity_type) <= 50);
      
      ALTER TABLE audit_logs
      ADD CONSTRAINT check_ip_address_format
      CHECK (ip_address IS NULL OR ip_address ~* '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$' OR ip_address ~* '^[0-9a-fA-F:]+$');
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('audit_logs');
  }
};
