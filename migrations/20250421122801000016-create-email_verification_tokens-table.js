'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('email_verification_tokens', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('email_verification_tokens', ['user_id'], { name: 'idx_email_verification_tokens_user_id' });
    await queryInterface.addIndex('email_verification_tokens', ['token'], { name: 'idx_email_verification_tokens_token' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('email_verification_tokens');
  }
};
