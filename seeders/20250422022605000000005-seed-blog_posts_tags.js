'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('blog_posts_tags', [
      {
        post_id: 1, // Getting Started with Node.js
        tag_id: 2, // Node.js
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 1, // Getting Started with Node.js
        tag_id: 7, // Tutorials
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 2, // Advanced React Hooks Tutorial
        tag_id: 3, // React
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 2, // Advanced React Hooks Tutorial
        tag_id: 1, // JavaScript
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 3, // Building RESTful APIs with Express
        tag_id: 2, // Node.js
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 5, // Funding Options for Early-Stage Startups
        tag_id: 6, // Entrepreneurship
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 6, // Introduction to MongoDB for Node.js Developers
        tag_id: 4, // Database
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: 8, // Deprecated: Old JavaScript Patterns to Avoid
        tag_id: 1, // JavaScript
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('blog_posts_tags', null, {});
  }
}; 