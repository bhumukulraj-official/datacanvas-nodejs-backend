'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get blog post IDs
    const posts = await queryInterface.sequelize.query(
      `SELECT id, slug FROM blog_posts;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const postMap = posts.reduce((acc, post) => {
      acc[post.slug] = post.id;
      return acc;
    }, {});

    // Get tag IDs
    const tags = await queryInterface.sequelize.query(
      `SELECT id, slug FROM blog_tags;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const tagMap = tags.reduce((acc, tag) => {
      acc[tag.slug] = tag.id;
      return acc;
    }, {});

    // Create blog post tags associations
    const postTags = [
      {
        post_id: postMap['getting-started-with-nodejs'],
        tag_id: tagMap['api'],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: postMap['getting-started-with-nodejs'],
        tag_id: tagMap['database'],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: postMap['react-best-practices'],
        tag_id: tagMap['ui-ux'],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: postMap['react-best-practices'],
        tag_id: tagMap['security'],
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('blog_posts_tags', postTags);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('blog_posts_tags', null, {});
  }
};