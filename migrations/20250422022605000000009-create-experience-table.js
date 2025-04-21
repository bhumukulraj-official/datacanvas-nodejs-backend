'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('experience', {
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
      title: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      company: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
      },
      technologies: {
        type: Sequelize.ARRAY(Sequelize.STRING(50)),
        defaultValue: [],
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
    await queryInterface.addIndex('experience', ["user_id"], { 
      name: 'idx_experience_user_id',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('experience', ["company"], { 
      name: 'idx_experience_company',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('experience', ["title"], { 
      name: 'idx_experience_title',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('experience', ["start_date"], { 
      name: 'idx_experience_start_date',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('experience', ["deleted_at"], { 
      name: 'idx_experience_deleted_at' 
    });

    // Add constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE experience
      ADD CONSTRAINT check_dates
      CHECK (end_date IS NULL OR end_date >= start_date);
      
      ALTER TABLE experience
      ADD CONSTRAINT check_title_length
      CHECK (char_length(title) >= 2 AND char_length(title) <= 100);
      
      ALTER TABLE experience
      ADD CONSTRAINT check_company_length
      CHECK (char_length(company) >= 2 AND char_length(company) <= 100);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('experience');
  }
};
