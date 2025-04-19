'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'user',
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      // Password management fields
      password_updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      password_history: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      // Account lockout fields
      failed_login_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      locked_until: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      // Session management fields
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      last_login_ip: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      active_sessions: {
        type: Sequelize.JSON,
        defaultValue: [],
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
    await queryInterface.addIndex('users', ["email"], { name: 'idx_users_email' });
    await queryInterface.addIndex('users', ["role"], { name: 'idx_users_role' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
