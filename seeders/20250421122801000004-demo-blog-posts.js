'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get user IDs
    const users = await queryInterface.sequelize.query(
      `SELECT id, username FROM users WHERE username IN ('admin', 'johndoe');`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const adminId = users.find(u => u.username === 'admin').id;
    const johnId = users.find(u => u.username === 'johndoe').id;

    // Get category IDs
    const categories = await queryInterface.sequelize.query(
      `SELECT id, slug FROM blog_categories;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.slug] = cat.id;
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

    const posts = [
      {
        title: 'Getting Started with Node.js',
        slug: 'getting-started-with-nodejs',
        content: 'This is a comprehensive guide to getting started with Node.js...',
        excerpt: 'Learn the basics of Node.js and start building your first application.',
        featured_image: 'https://example.com/images/nodejs.jpg',
        status: 'published',
        author_id: adminId,
        category_id: categoryMap['web-development'],
        published_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        title: 'React Best Practices',
        slug: 'react-best-practices',
        content: 'Discover the best practices for building React applications...',
        excerpt: 'Learn how to write better React code with these best practices.',
        featured_image: 'https://example.com/images/react.jpg',
        status: 'published',
        author_id: johnId,
        category_id: categoryMap['web-development'],
        published_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Insert posts
    const insertedPosts = await queryInterface.bulkInsert('blog_posts', posts, { returning: true });

    // Insert post tags
    const postTags = [
      {
        post_id: insertedPosts[0].id,
        tag_id: tagMap['javascript'],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: insertedPosts[0].id,
        tag_id: tagMap['nodejs'],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: insertedPosts[1].id,
        tag_id: tagMap['javascript'],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        post_id: insertedPosts[1].id,
        tag_id: tagMap['react'],
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('blog_posts_tags', postTags);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('blog_posts_tags', null, {});
    await queryInterface.bulkDelete('blog_posts', null, {});
  }
}; 