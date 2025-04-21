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
        type: Sequelize.STRING,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      size: {
        type: Sequelize.INTEGER,
      },
      filename: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.TEXT,
      },
      visibility: {
        type: Sequelize.STRING,
        defaultValue: 'public',
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      optimization_status: {
        type: Sequelize.STRING,
        defaultValue: 'none',
      },
      optimized_url: {
        type: Sequelize.STRING,
      },
      optimized_size: {
        type: Sequelize.INTEGER,
      },
      optimization_metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      thumbnail_url: {
        type: Sequelize.STRING,
      },
      uploaded_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('media', ["user_id"], { name: 'idx_media_user_id' });
    await queryInterface.addIndex('media', ["type"], { name: 'idx_media_type' });
    await queryInterface.addIndex('media', ["visibility"], { name: 'idx_media_visibility' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('media');
  }
};
