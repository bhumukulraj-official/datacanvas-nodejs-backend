'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('email_verification_tokens', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4
        },
        user_id: {
          type: Sequelize.UUID,
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
      }, { transaction });

      // Add indexes
      await queryInterface.addIndex('email_verification_tokens', ['user_id'], { 
        name: 'idx_email_verification_tokens_user_id',
        transaction
      });
      
      await queryInterface.addIndex('email_verification_tokens', ['token'], { 
        name: 'idx_email_verification_tokens_token',
        unique: true,
        transaction
      });
      
      await queryInterface.addIndex('email_verification_tokens', ['expires_at'], { 
        name: 'idx_email_verification_tokens_expires_at',
        transaction
      });

      // Add constraints for PostgreSQL
      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres') {
        await queryInterface.sequelize.query(`
          ALTER TABLE email_verification_tokens
          ADD CONSTRAINT check_token_length
          CHECK (char_length(token) >= 32 AND char_length(token) <= 255);
          
          ALTER TABLE email_verification_tokens
          ADD CONSTRAINT check_expires_at
          CHECK (expires_at > created_at);
        `, { transaction });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('email_verification_tokens', { transaction });
    });
  }
};
