'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // First, check if the column already exists to avoid errors
      const tableInfo = await queryInterface.describeTable('blog_posts');

      if (!tableInfo.searchVector) {
        // Add the tsvector column
        await queryInterface.sequelize.query(`
          ALTER TABLE blog_posts 
          ADD COLUMN "searchVector" tsvector;
        `);

        // Create GIN index for fast full-text search
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_blog_posts_search_vector ON blog_posts USING GIN("searchVector");
        `);

        // Update the search vector for existing posts
        await queryInterface.sequelize.query(`
          UPDATE blog_posts
          SET "searchVector" = 
            setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(content, '')), 'C');
        `);

        // Create a trigger function to automatically update the search vector
        await queryInterface.sequelize.query(`
          CREATE OR REPLACE FUNCTION blog_posts_search_vector_update() RETURNS trigger AS $$
          BEGIN
            NEW."searchVector" :=
              setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
              setweight(to_tsvector('english', coalesce(NEW.excerpt, '')), 'B') ||
              setweight(to_tsvector('english', coalesce(NEW.content, '')), 'C');
            RETURN NEW;
          END
          $$ LANGUAGE plpgsql;
        `);

        // Create the trigger
        await queryInterface.sequelize.query(`
          CREATE TRIGGER blog_posts_search_vector_update
          BEFORE INSERT OR UPDATE
          ON blog_posts
          FOR EACH ROW
          EXECUTE FUNCTION blog_posts_search_vector_update();
        `);
      }

      console.log('Added searchVector column to blog_posts table');
    } catch (error) {
      console.error('Error adding searchVector column:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Drop the trigger first
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS blog_posts_search_vector_update ON blog_posts;
      `);

      // Drop the trigger function
      await queryInterface.sequelize.query(`
        DROP FUNCTION IF EXISTS blog_posts_search_vector_update();
      `);
      
      // Drop the index
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS idx_blog_posts_search_vector;
      `);

      // Remove the column
      await queryInterface.sequelize.query(`
        ALTER TABLE blog_posts DROP COLUMN IF EXISTS "searchVector";
      `);

      console.log('Removed searchVector column from blog_posts table');
    } catch (error) {
      console.error('Error removing searchVector column:', error);
      throw error;
    }
  }
}; 