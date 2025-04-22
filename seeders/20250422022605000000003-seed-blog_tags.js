'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('blog_tags', [
      {
        name: 'JavaScript',
        slug: 'javascript',
        description: 'Articles about JavaScript programming language',
        created_by: 1, // admin_user
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        name: 'Node.js',
        slug: 'nodejs',
        description: 'Content related to Node.js runtime environment',
        created_by: 2, // editor_main
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        name: 'React',
        slug: 'react',
        description: 'Frontend development with React library',
        created_by: 3, // writer_one
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        name: 'Database',
        slug: 'database',
        description: 'Articles about database technologies and management',
        created_by: 1, // admin_user
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        name: 'Fitness',
        slug: 'fitness',
        description: 'Workout routines, techniques, and fitness tips',
        created_by: 5, // content_creator
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        name: 'Entrepreneurship',
        slug: 'entrepreneurship',
        description: 'Starting and growing businesses as an entrepreneur',
        created_by: 3, // writer_one
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        name: 'Tutorials',
        slug: 'tutorials',
        description: 'Step-by-step guides and how-to articles',
        created_by: 2, // editor_main
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        name: 'Legacy',
        slug: 'legacy',
        description: 'Deprecated tags for archived content',
        created_by: 1, // admin_user
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: new Date() // This is a soft-deleted tag
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('blog_tags', null, {});
  }
}; 