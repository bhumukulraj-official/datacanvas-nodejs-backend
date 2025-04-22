'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // Get the database dialect
      const dialect = queryInterface.sequelize.getDialect();
      
      await queryInterface.createTable('email_verification_tokens', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4
        },
        user_id: {
          type: Sequelize.INTEGER, // Changed from UUID to INTEGER to match users table
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

      // Add dialect-specific constraints
      if (dialect === 'postgres') {
        await queryInterface.sequelize.query(`
          ALTER TABLE email_verification_tokens
          ADD CONSTRAINT check_token_length
          CHECK (char_length(token) >= 32 AND char_length(token) <= 255);
          
          ALTER TABLE email_verification_tokens
          ADD CONSTRAINT check_expires_at
          CHECK (expires_at > created_at);
        `, { transaction });
      } else if (dialect === 'sqlite') {
        // SQLite supports CHECK constraints
        await queryInterface.sequelize.query(`
          ALTER TABLE email_verification_tokens
          ADD CONSTRAINT check_token_length
          CHECK (length(token) >= 32 AND length(token) <= 255);
          
          ALTER TABLE email_verification_tokens
          ADD CONSTRAINT check_expires_at
          CHECK (expires_at > created_at);
        `, { transaction });
      } else if (dialect === 'mysql' || dialect === 'mariadb') {
        // MySQL 8.0.16+ supports CHECK constraints
        // For older versions, we can create triggers or handle at application level
        if (dialect === 'mysql') {
          try {
            // Try to add constraints for MySQL 8.0.16+
            await queryInterface.sequelize.query(`
              ALTER TABLE email_verification_tokens
              ADD CONSTRAINT check_token_length
              CHECK (CHAR_LENGTH(token) >= 32 AND CHAR_LENGTH(token) <= 255);
              
              ALTER TABLE email_verification_tokens
              ADD CONSTRAINT check_expires_at
              CHECK (expires_at > created_at);
            `, { transaction });
          } catch (error) {
            // Fall back to creating a trigger for older MySQL versions
            console.log('MySQL version may not support CHECK constraints. Validation will be handled at application level.');
            
            // Create a trigger to enforce expiration date validation
            await queryInterface.sequelize.query(`
              CREATE TRIGGER email_verification_tokens_expire_date_check
              BEFORE INSERT ON email_verification_tokens
              FOR EACH ROW
              BEGIN
                IF NEW.expires_at <= NEW.created_at THEN
                  SIGNAL SQLSTATE '45000' 
                  SET MESSAGE_TEXT = 'Expiration date must be in the future';
                END IF;
              END;
            `, { transaction });
          }
        } else {
          console.log('MariaDB: Additional constraints will be handled at application level');
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const dialect = queryInterface.sequelize.getDialect();
      
      // Clean up any dialect-specific objects before dropping the table
      if (dialect === 'mysql') {
        try {
          // Drop trigger if it exists
          await queryInterface.sequelize.query(`
            DROP TRIGGER IF EXISTS email_verification_tokens_expire_date_check;
          `, { transaction });
        } catch (error) {
          console.log('Error removing MySQL trigger:', error.message);
        }
      }
      
      await queryInterface.dropTable('email_verification_tokens', { transaction });
    });
  }
};
