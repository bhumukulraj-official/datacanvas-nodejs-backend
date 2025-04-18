'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get the admin user ID
    const [adminUser] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1;`
    );
    
    if (!adminUser || !adminUser.length) return;
    const adminId = adminUser[0].id;

    // Create sample skills
    await queryInterface.bulkInsert('skills', [
      {
        user_id: adminId,
        name: 'JavaScript',
        category: 'Frontend',
        proficiency: 90,
        icon: 'javascript-icon.svg',
        is_highlighted: true,
        display_order: 1,
        description: 'Modern JavaScript including ES6+ features',
        years_of_experience: 5.5,
        last_used_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: adminId,
        name: 'React',
        category: 'Frontend',
        proficiency: 85,
        icon: 'react-icon.svg',
        is_highlighted: true,
        display_order: 2,
        description: 'Building modern UIs with React and related libraries',
        years_of_experience: 4.0,
        last_used_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: adminId,
        name: 'Node.js',
        category: 'Backend',
        proficiency: 80,
        icon: 'nodejs-icon.svg',
        is_highlighted: true,
        display_order: 3,
        description: 'Server-side JavaScript with Express framework',
        years_of_experience: 4.0,
        last_used_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: adminId,
        name: 'PostgreSQL',
        category: 'Database',
        proficiency: 75,
        icon: 'postgresql-icon.svg',
        is_highlighted: true,
        display_order: 4,
        description: 'Relational database design and optimization',
        years_of_experience: 3.5,
        last_used_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: adminId,
        name: 'Docker',
        category: 'DevOps',
        proficiency: 70,
        icon: 'docker-icon.svg',
        is_highlighted: false,
        display_order: 5,
        description: 'Containerization and deployment',
        years_of_experience: 2.0,
        last_used_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    const [adminUser] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1;`
    );
    
    if (adminUser && adminUser.length > 0) {
      const adminId = adminUser[0].id;
      await queryInterface.bulkDelete('skills', { user_id: adminId }, {});
    }
  }
}; 