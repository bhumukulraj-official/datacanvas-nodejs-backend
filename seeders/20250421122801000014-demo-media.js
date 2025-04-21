'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get user IDs
    const users = await queryInterface.sequelize.query(
      `SELECT id, username FROM users;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Create a mapping of usernames to IDs
    const userIds = users.reduce((acc, user) => {
      acc[user.username] = user.id;
      return acc;
    }, {});

    const media = [
      {
        user_id: userIds['admin'],
        url: 'https://example.com/uploads/profile-image.jpg',
        type: 'image/jpeg',
        size: 1024 * 1024, // 1MB
        filename: 'profile-image.jpg',
        description: 'Admin profile image',
        visibility: 'public',
        metadata: JSON.stringify({
          dimensions: { width: 800, height: 800 },
          format: 'JPEG'
        }),
        optimization_status: 'completed',
        optimized_url: 'https://example.com/uploads/profile-image-optimized.jpg',
        optimized_size: 512 * 1024, // 512KB
        optimization_metadata: JSON.stringify({
          compression_ratio: 0.5,
          quality: 85
        }),
        thumbnail_url: 'https://example.com/uploads/profile-image-thumb.jpg',
        uploaded_at: new Date()
      },
      {
        user_id: userIds['johndoe'],
        url: 'https://example.com/uploads/project-screenshot.png',
        type: 'image/png',
        size: 2 * 1024 * 1024, // 2MB
        filename: 'project-screenshot.png',
        description: 'Project screenshot for portfolio',
        visibility: 'public',
        metadata: JSON.stringify({
          dimensions: { width: 1920, height: 1080 },
          format: 'PNG'
        }),
        optimization_status: 'completed',
        optimized_url: 'https://example.com/uploads/project-screenshot-optimized.png',
        optimized_size: 1 * 1024 * 1024, // 1MB
        optimization_metadata: JSON.stringify({
          compression_ratio: 0.5,
          quality: 90
        }),
        thumbnail_url: 'https://example.com/uploads/project-screenshot-thumb.png',
        uploaded_at: new Date()
      },
      {
        user_id: userIds['janesmith'],
        url: 'https://example.com/uploads/portfolio-preview.jpg',
        type: 'image/jpeg',
        size: 1.5 * 1024 * 1024, // 1.5MB
        filename: 'portfolio-preview.jpg',
        description: 'Portfolio preview image',
        visibility: 'public',
        metadata: JSON.stringify({
          dimensions: { width: 1600, height: 900 },
          format: 'JPEG'
        }),
        optimization_status: 'completed',
        optimized_url: 'https://example.com/uploads/portfolio-preview-optimized.jpg',
        optimized_size: 750 * 1024, // 750KB
        optimization_metadata: JSON.stringify({
          compression_ratio: 0.5,
          quality: 85
        }),
        thumbnail_url: 'https://example.com/uploads/portfolio-preview-thumb.jpg',
        uploaded_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('media', media, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('media', null, {});
  }
}; 