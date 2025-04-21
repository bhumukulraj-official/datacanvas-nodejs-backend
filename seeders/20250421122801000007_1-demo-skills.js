'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get user IDs from the database
    const users = await queryInterface.sequelize.query(
      `SELECT id, username FROM users;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Create a mapping of usernames to IDs
    const userIds = users.reduce((acc, user) => {
      acc[user.username] = user.id;
      return acc;
    }, {});

    // Insert skills for each user
    return queryInterface.bulkInsert('skills', [
      // Admin's skills
      {
        user_id: userIds['admin'],
        name: 'Node.js',
        category: 'Backend',
        proficiency: 90,
        icon: 'nodejs-icon',
        is_highlighted: true,
        display_order: 1,
        description: 'Advanced Node.js development with Express and TypeScript',
        years_of_experience: 5,
        last_used_date: new Date(),
        certification_url: 'https://example.com/certifications/nodejs',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: userIds['admin'],
        name: 'React',
        category: 'Frontend',
        proficiency: 85,
        icon: 'react-icon',
        is_highlighted: true,
        display_order: 2,
        description: 'React development with Redux and TypeScript',
        years_of_experience: 4,
        last_used_date: new Date(),
        certification_url: 'https://example.com/certifications/react',
        created_at: new Date(),
        updated_at: new Date()
      },
      // John Doe's skills
      {
        user_id: userIds['johndoe'],
        name: 'JavaScript',
        category: 'Frontend',
        proficiency: 95,
        icon: 'javascript-icon',
        is_highlighted: true,
        display_order: 1,
        description: 'Advanced JavaScript development',
        years_of_experience: 6,
        last_used_date: new Date(),
        certification_url: 'https://example.com/certifications/javascript',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: userIds['johndoe'],
        name: 'React',
        category: 'Frontend',
        proficiency: 90,
        icon: 'react-icon',
        is_highlighted: true,
        display_order: 2,
        description: 'React development with hooks and context',
        years_of_experience: 4,
        last_used_date: new Date(),
        certification_url: 'https://example.com/certifications/react',
        created_at: new Date(),
        updated_at: new Date()
      },
      // Jane Smith's skills
      {
        user_id: userIds['janesmith'],
        name: 'UI Design',
        category: 'Design',
        proficiency: 95,
        icon: 'ui-design-icon',
        is_highlighted: true,
        display_order: 1,
        description: 'User interface design with Figma',
        years_of_experience: 5,
        last_used_date: new Date(),
        certification_url: 'https://example.com/certifications/ui-design',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: userIds['janesmith'],
        name: 'UX Research',
        category: 'Design',
        proficiency: 90,
        icon: 'ux-research-icon',
        is_highlighted: true,
        display_order: 2,
        description: 'User experience research and testing',
        years_of_experience: 4,
        last_used_date: new Date(),
        certification_url: 'https://example.com/certifications/ux-research',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('skills', null, {});
  }
}; 