'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('api_keys', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      key_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      permissions: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        defaultValue: [],
      },
      status: {
        type: 'api_key_status',
        defaultValue: 'active',
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      last_used_at: {
        type: Sequelize.DATE,
        allowNull: true,
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
    await queryInterface.addIndex('api_keys', ["key_hash"], { 
      name: 'idx_api_keys_key_hash',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('api_keys', ["name"], { 
      name: 'idx_api_keys_name',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('api_keys', ["status"], { 
      name: 'idx_api_keys_status',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('api_keys', ["expires_at"], { 
      name: 'idx_api_keys_expires_at',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('api_keys', ["deleted_at"], { 
      name: 'idx_api_keys_deleted_at' 
    });

    // Add constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE api_keys
      ADD CONSTRAINT check_name_length
      CHECK (char_length(name) >= 2 AND char_length(name) <= 100);
      
      ALTER TABLE api_keys
      ADD CONSTRAINT check_key_hash_length
      CHECK (char_length(key_hash) >= 32 AND char_length(key_hash) <= 255);
      
      ALTER TABLE api_keys
      ADD CONSTRAINT check_expires_at
      CHECK (expires_at IS NULL OR expires_at > created_at);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('api_keys');
  }
};
