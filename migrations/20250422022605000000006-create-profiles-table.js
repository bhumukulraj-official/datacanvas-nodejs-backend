'use strict';

// Import the addConstraints utility
const { addConstraints } = require('../src/utils/migrationUtils');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('profiles', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        title: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        bio: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        avatar_url: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        phone: {
          type: Sequelize.STRING(20),
          allowNull: true,
        },
        location: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        social_links: {
          type: Sequelize.JSONB,
          defaultValue: {},
          allowNull: false,
        },
        resume_url: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        website: {
          type: Sequelize.STRING(255),
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
      }, { transaction });

      // Add indexes
      await queryInterface.addIndex('profiles', ["user_id"], { 
        name: 'idx_profiles_user_id',
        unique: true,
        where: {
          deleted_at: null
        },
        transaction
      });
      
      await queryInterface.addIndex('profiles', ["deleted_at"], { 
        name: 'idx_profiles_deleted_at',
        transaction
      });

      // Add URL validation constraints using the utility function
      await addConstraints(queryInterface, 'profiles', {
        'chk_profiles_website': "website IS NULL OR website ~ '^https?://[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-._~:/?#[\\]@!$&''()*+,;=]*$'",
        'chk_profiles_avatar_url': "avatar_url IS NULL OR avatar_url ~ '^https?://[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-._~:/?#[\\]@!$&''()*+,;=]*$'"
      }, transaction);

      // Add constraints for PostgreSQL
      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres') {
        await queryInterface.sequelize.query(`
          ALTER TABLE profiles
          ADD CONSTRAINT check_phone_format
          CHECK (phone IS NULL OR phone ~* '^[+]?[0-9]{10,15}$');
        `, { transaction });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('profiles', { transaction });
    });
  }
};
