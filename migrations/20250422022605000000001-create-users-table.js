'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Use a transaction for database consistency
    return queryInterface.sequelize.transaction(async (transaction) => {
      // Create the table
      await queryInterface.createTable('users', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        username: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
          validate: {
            is: /^[a-zA-Z0-9_]{3,50}$/
          }
        },
        email: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true
          }
        },
        password: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        password_salt: {
          type: Sequelize.STRING(64),
          allowNull: true
        },
        first_name: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        last_name: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        bio: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        avatar: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        role: {
          type: Sequelize.ENUM('admin', 'editor', 'user'),
          allowNull: false,
          defaultValue: 'user'
        },
        status: {
          type: Sequelize.ENUM('active', 'inactive', 'suspended', 'banned'),
          allowNull: false,
          defaultValue: 'active'
        },
        is_email_verified: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        last_login: {
          type: Sequelize.DATE,
          allowNull: true
        },
        login_attempts: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        locked_until: {
          type: Sequelize.DATE,
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
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // Add indexes
      await queryInterface.addIndex('users', ['email'], { 
        name: 'idx_users_email',
        unique: true,
        where: {
          deleted_at: null
        },
        transaction
      });
      
      await queryInterface.addIndex('users', ['username'], { 
        name: 'idx_users_username',
        unique: true,
        where: {
          deleted_at: null
        },
        transaction
      });
      
      await queryInterface.addIndex('users', ['role'], { 
        name: 'idx_users_role',
        transaction
      });
      
      await queryInterface.addIndex('users', ['status'], { 
        name: 'idx_users_status',
        transaction
      });
      
      await queryInterface.addIndex('users', ['deleted_at'], { 
        name: 'idx_users_deleted_at',
        transaction
      });

      // Add constraints for PostgreSQL
      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres') {
        await queryInterface.sequelize.query(`
          ALTER TABLE users
          ADD CONSTRAINT check_password_length
          CHECK (char_length(password) >= 8);
          
          ALTER TABLE users
          ADD CONSTRAINT check_username_length
          CHECK (char_length(username) >= 3 AND char_length(username) <= 50);
        `, { transaction });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('users', { transaction });
    });
  }
};
