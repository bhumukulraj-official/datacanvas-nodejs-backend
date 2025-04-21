'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('testimonials', {
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
      author_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      author_title: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      company: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      avatar_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      website: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      status: {
        type: 'testimonial_status',
        defaultValue: 'pending',
        allowNull: false,
      },
      reviewed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      reviewed_at: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('testimonials', ["user_id"], { 
      name: 'idx_testimonials_user_id',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('testimonials', ["status"], { 
      name: 'idx_testimonials_status',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('testimonials', ["is_featured"], { 
      name: 'idx_testimonials_is_featured',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('testimonials', ["display_order"], { 
      name: 'idx_testimonials_display_order',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('testimonials', ["reviewed_by"], { 
      name: 'idx_testimonials_reviewed_by',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('testimonials', ["deleted_at"], { 
      name: 'idx_testimonials_deleted_at' 
    });
    
    // Add composite indexes
    await queryInterface.addIndex('testimonials', ["user_id", "status"], { 
      name: 'idx_testimonials_user_status',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('testimonials', ["user_id", "is_featured"], { 
      name: 'idx_testimonials_user_featured',
      where: {
        deleted_at: null
      }
    });

    // Add constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE testimonials
      ADD CONSTRAINT check_rating_range
      CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));
      
      ALTER TABLE testimonials
      ADD CONSTRAINT check_author_name_length
      CHECK (char_length(author_name) >= 2 AND char_length(author_name) <= 100);
      
      ALTER TABLE testimonials
      ADD CONSTRAINT check_content_length
      CHECK (char_length(content) >= 10);
      
      ALTER TABLE testimonials
      ADD CONSTRAINT check_website_format
      CHECK (website IS NULL OR website ~* '^https?://[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\\.[a-zA-Z]{2,}(?:\\.[a-zA-Z]{2,})?$');
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('testimonials');
  }
};
