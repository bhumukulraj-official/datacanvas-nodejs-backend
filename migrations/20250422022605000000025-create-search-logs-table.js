'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.createTable('search_logs', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        query: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        session_id: {
          type: Sequelize.STRING,
          allowNull: true
        },
        content_type: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        result_count: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        filters: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        query_time: {
          type: Sequelize.FLOAT,
          allowNull: true
        },
        user_agent: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        ip_address: {
          type: Sequelize.STRING,
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

      // Create indexes
      await queryInterface.addIndex('search_logs', ['user_id'], {
        name: 'search_logs_user_id_idx'
      });
      
      await queryInterface.addIndex('search_logs', ['content_type'], {
        name: 'search_logs_content_type_idx'
      });
      
      await queryInterface.addIndex('search_logs', ['created_at'], {
        name: 'search_logs_created_at_idx'
      });

      // Add GIN index for query text search
      // First, make sure the pg_trgm extension is enabled
      await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
      
      // Then create the GIN index using trigram operators for fuzzy search
      await queryInterface.sequelize.query(`
        CREATE INDEX search_logs_query_idx ON search_logs 
        USING gin(query gin_trgm_ops);
      `);

      console.log('Created search_logs table and indexes');
    } catch (error) {
      console.error('Error creating search_logs table:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Drop indexes first
      await queryInterface.removeIndex('search_logs', 'search_logs_query_idx');
      await queryInterface.removeIndex('search_logs', 'search_logs_user_id_idx');
      await queryInterface.removeIndex('search_logs', 'search_logs_content_type_idx');
      await queryInterface.removeIndex('search_logs', 'search_logs_created_at_idx');
      
      // Then drop the table
      await queryInterface.dropTable('search_logs');
      
      console.log('Dropped search_logs table and indexes');
    } catch (error) {
      console.error('Error dropping search_logs table:', error);
      throw error;
    }
  }
}; 