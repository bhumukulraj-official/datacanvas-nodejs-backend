'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('skills', {
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
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      proficiency: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
          max: 100
        }
      },
      icon: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      is_highlighted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      years_of_experience: {
        type: Sequelize.DECIMAL(4, 1),
        allowNull: true,
      },
      last_used_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      certification_url: {
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
    });

    // Add indexes
    await queryInterface.addIndex('skills', ["user_id"], { 
      name: 'idx_skills_user_id',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('skills', ["category"], { 
      name: 'idx_skills_category',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('skills', ["is_highlighted"], { 
      name: 'idx_skills_is_highlighted',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('skills', ["display_order"], { 
      name: 'idx_skills_display_order',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('skills', ["name"], { 
      name: 'idx_skills_name',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('skills', ["deleted_at"], { 
      name: 'idx_skills_deleted_at' 
    });
    
    // Add composite indexes
    await queryInterface.addIndex('skills', ["user_id", "category"], { 
      name: 'idx_skills_user_category',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('skills', ["user_id", "is_highlighted"], { 
      name: 'idx_skills_user_highlighted',
      where: {
        deleted_at: null
      }
    });

    // Add constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE skills
      ADD CONSTRAINT check_proficiency_range
      CHECK (proficiency IS NULL OR (proficiency >= 0 AND proficiency <= 100));
      
      ALTER TABLE skills
      ADD CONSTRAINT check_years_of_experience
      CHECK (years_of_experience IS NULL OR years_of_experience >= 0);
      
      ALTER TABLE skills
      ADD CONSTRAINT check_certification_url_format
      CHECK (certification_url IS NULL OR certification_url ~* '^https?://[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\\.[a-zA-Z]{2,}(?:\\.[a-zA-Z]{2,})?$');
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('skills');
  }
};
