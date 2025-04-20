'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First ensure the enum type exists
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blog_post_status') THEN
          CREATE TYPE blog_post_status AS ENUM ('draft', 'published');
        END IF;
      END
      $$;
    `);
    
    await queryInterface.createTable('blog_posts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(200),
        allowNull: false,
        unique: true
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      excerpt: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      featured_image: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('draft', 'published'),
        defaultValue: 'draft'
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'blog_categories',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      author_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      published_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add search vector column
    await queryInterface.sequelize.query(`
      ALTER TABLE blog_posts ADD COLUMN search_vector TSVECTOR;
    `);

    // Add indexes
    await queryInterface.addIndex('blog_posts', ['slug'], {
      name: 'blog_posts_slug_idx',
      unique: true
    });
    
    await queryInterface.addIndex('blog_posts', ['category_id'], {
      name: 'blog_posts_category_id_idx'
    });
    
    await queryInterface.addIndex('blog_posts', ['author_id'], {
      name: 'blog_posts_author_id_idx'
    });
    
    await queryInterface.addIndex('blog_posts', ['status'], {
      name: 'blog_posts_status_idx'
    });
    
    await queryInterface.addIndex('blog_posts', ['published_at'], {
      name: 'blog_posts_published_at_idx'
    });
    
    await queryInterface.addIndex('blog_posts', ['tags'], {
      name: 'blog_posts_tags_idx',
      using: 'gin'
    });
    
    // Add GIN index for full-text search
    await queryInterface.sequelize.query(`
      CREATE INDEX blog_posts_search_idx ON blog_posts USING gin(search_vector);
    `);
    
    // Create a trigger to automatically update the search vector when a post is created or updated
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION blog_posts_search_vector_update() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B') ||
          setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER blog_posts_search_vector_update_trigger
      BEFORE INSERT OR UPDATE ON blog_posts
      FOR EACH ROW EXECUTE FUNCTION blog_posts_search_vector_update();
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop the trigger and function
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS blog_posts_search_vector_update_trigger ON blog_posts;
      DROP FUNCTION IF EXISTS blog_posts_search_vector_update();
    `);
    
    await queryInterface.dropTable('blog_posts');
  }
};
