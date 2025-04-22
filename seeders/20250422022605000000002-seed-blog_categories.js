'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert top-level categories first (no parent)
    const parentCategories = await queryInterface.bulkInsert('blog_categories', [
      {
        name: 'Technology',
        slug: 'technology',
        description: 'The latest in technology news, trends, and innovations',
        parent_id: null,
        created_by: 1, // admin_user
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        name: 'Lifestyle',
        slug: 'lifestyle',
        description: 'Tips for balanced living and personal growth',
        parent_id: null,
        created_by: 5, // content_creator
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        name: 'Business',
        slug: 'business',
        description: 'Business strategies, entrepreneurship, and market insights',
        parent_id: null,
        created_by: 3, // writer_one
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        name: 'Archived',
        slug: 'archived',
        description: 'Older content that has been archived',
        parent_id: null,
        created_by: 1, // admin_user
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: new Date() // This is a soft-deleted category
      }
    ], { returning: true });

    // Get the inserted records to use their IDs
    const categories = await queryInterface.sequelize.query(
      `SELECT id, slug FROM blog_categories ORDER BY id ASC`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Create a map of slug to ID
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.slug] = cat.id;
    });

    // Insert second-level categories with correct parent IDs
    await queryInterface.bulkInsert('blog_categories', [
      {
        name: 'Programming',
        slug: 'programming',
        description: 'Programming tutorials, tips, and best practices',
        parent_id: categoryMap['technology'],
        created_by: 1, // admin_user
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        name: 'Health & Wellness',
        slug: 'health-wellness',
        description: 'Articles about fitness, nutrition, and mental health',
        parent_id: categoryMap['lifestyle'],
        created_by: 5, // content_creator
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        name: 'Startups',
        slug: 'startups',
        description: 'Startup guides, funding information, and success stories',
        parent_id: categoryMap['business'],
        created_by: 3, // writer_one
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      }
    ], { returning: true });

    // Update the category map with newly added categories
    const updatedCategories = await queryInterface.sequelize.query(
      `SELECT id, slug FROM blog_categories ORDER BY id ASC`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Update the map
    updatedCategories.forEach(cat => {
      categoryMap[cat.slug] = cat.id;
    });

    // Insert third-level categories
    await queryInterface.bulkInsert('blog_categories', [
      {
        name: 'Web Development',
        slug: 'web-development',
        description: 'Frontend and backend web development resources',
        parent_id: categoryMap['programming'],
        created_by: 2, // editor_main
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('blog_categories', null, {});
  }
}; 