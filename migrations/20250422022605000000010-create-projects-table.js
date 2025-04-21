'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('projects', {
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
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(200),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      thumbnail_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING(50)),
        defaultValue: [],
        allowNull: false,
      },
      technologies: {
        type: Sequelize.ARRAY(Sequelize.STRING(50)),
        defaultValue: [],
        allowNull: false,
      },
      github_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      live_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: 'project_status',
        allowNull: false,
        defaultValue: 'draft',
      },
      meta_title: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      meta_description: {
        type: Sequelize.STRING(200),
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
    await queryInterface.addIndex('projects', ["user_id"], { 
      name: 'idx_projects_user_id',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('projects', ["slug"], { 
      name: 'idx_projects_slug',
      unique: true,
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('projects', ["status"], { 
      name: 'idx_projects_status',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('projects', ["is_featured"], { 
      name: 'idx_projects_is_featured',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('projects', ["display_order"], { 
      name: 'idx_projects_display_order',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('projects', ["deleted_at"], { 
      name: 'idx_projects_deleted_at' 
    });
    
    // Add composite indexes
    await queryInterface.addIndex('projects', ["user_id", "status"], { 
      name: 'idx_projects_user_status',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('projects', ["user_id", "is_featured"], { 
      name: 'idx_projects_user_featured',
      where: {
        deleted_at: null
      }
    });

    // Add constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE projects
      ADD CONSTRAINT check_dates
      CHECK (end_date IS NULL OR end_date >= start_date);
      
      ALTER TABLE projects
      ADD CONSTRAINT check_title_length
      CHECK (char_length(title) >= 3 AND char_length(title) <= 200);
      
      ALTER TABLE projects
      ADD CONSTRAINT check_description_length
      CHECK (char_length(description) >= 10);
      
      ALTER TABLE projects
      ADD CONSTRAINT check_slug_format
      CHECK (slug ~* '^[a-z0-9]+(?:-[a-z0-9]+)*$');
      
      ALTER TABLE projects
      ADD CONSTRAINT check_url_format
      CHECK (
        (github_url IS NULL OR github_url ~* '^https?://[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\\.[a-zA-Z]{2,}(?:\\.[a-zA-Z]{2,})?$')
        AND
        (live_url IS NULL OR live_url ~* '^https?://[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\\.[a-zA-Z]{2,}(?:\\.[a-zA-Z]{2,})?$')
      );
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('projects');
  }
};
