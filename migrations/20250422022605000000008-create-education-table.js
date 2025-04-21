'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('education', {
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
      institution: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      degree: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      field_of_study: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      is_current: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      grade: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      activities: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING(100),
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
    });

    // Add indexes
    await queryInterface.addIndex('education', ["user_id"], { 
      name: 'idx_education_user_id',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('education', ["institution"], { 
      name: 'idx_education_institution',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('education', ["degree"], { 
      name: 'idx_education_degree',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('education', ["field_of_study"], { 
      name: 'idx_education_field_of_study',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('education', ["start_date"], { 
      name: 'idx_education_start_date',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('education', ["deleted_at"], { 
      name: 'idx_education_deleted_at' 
    });
    
    // Add composite indexes
    await queryInterface.addIndex('education', ["user_id", "institution"], { 
      name: 'idx_education_user_institution',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('education', ["user_id", "degree"], { 
      name: 'idx_education_user_degree',
      where: {
        deleted_at: null
      }
    });

    // Add constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE education
      ADD CONSTRAINT check_dates
      CHECK (end_date IS NULL OR end_date >= start_date);
      
      ALTER TABLE education
      ADD CONSTRAINT check_is_current
      CHECK (is_current = false OR end_date IS NULL);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('education');
  }
};
