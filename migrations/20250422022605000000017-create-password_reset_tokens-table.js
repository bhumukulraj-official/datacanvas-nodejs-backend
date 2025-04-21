'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('password_reset_tokens', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
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
    await queryInterface.addIndex('password_reset_tokens', ['user_id'], { 
      name: 'idx_password_reset_tokens_user_id' 
    });
    
    await queryInterface.addIndex('password_reset_tokens', ['token'], { 
      name: 'idx_password_reset_tokens_token',
      unique: true
    });
    
    await queryInterface.addIndex('password_reset_tokens', ['expires_at'], { 
      name: 'idx_password_reset_tokens_expires_at' 
    });

    // Add constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE password_reset_tokens
      ADD CONSTRAINT check_token_length
      CHECK (char_length(token) >= 32 AND char_length(token) <= 255);
      
      ALTER TABLE password_reset_tokens
      ADD CONSTRAINT check_expires_at
      CHECK (expires_at > created_at);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('password_reset_tokens');
  }
};
