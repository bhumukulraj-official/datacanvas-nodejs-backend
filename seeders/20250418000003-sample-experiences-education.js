'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get the admin user ID
    const [adminUser] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1;`
    );
    
    if (!adminUser || !adminUser.length) return;
    const adminId = adminUser[0].id;

    // Create sample work experiences
    await queryInterface.bulkInsert('experience', [
      {
        user_id: adminId,
        title: 'Senior Full Stack Developer',
        company: 'Tech Innovations Inc.',
        start_date: '2020-03-01',
        end_date: null, // Current position
        description: 'Leading development of enterprise-level web applications using React, Node.js, and PostgreSQL. Managing a team of 5 developers and implementing CI/CD pipelines for streamlined deployments.',
        technologies: JSON.stringify(['React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS']),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: adminId,
        title: 'Frontend Developer',
        company: 'Digital Solutions LLC',
        start_date: '2018-06-15',
        end_date: '2020-02-28',
        description: 'Developed responsive web applications and implemented UI/UX designs. Collaborated with design team and backend developers to create seamless user experiences.',
        technologies: JSON.stringify(['JavaScript', 'React', 'CSS', 'Redux']),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: adminId,
        title: 'Web Developer Intern',
        company: 'Startup Hub',
        start_date: '2017-05-01',
        end_date: '2018-06-10',
        description: 'Assisted in developing web applications, fixing bugs, and implementing new features. Gained hands-on experience with modern web development technologies.',
        technologies: JSON.stringify(['HTML', 'CSS', 'JavaScript', 'jQuery']),
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], {});

    // Create sample education
    await queryInterface.bulkInsert('education', [
      {
        user_id: adminId,
        institution: 'University of Technology',
        degree: 'Master of Science',
        field_of_study: 'Computer Science',
        start_date: '2015-09-01',
        end_date: '2017-05-15',
        description: 'Specialized in software engineering and web technologies. Thesis on scalable architecture for real-time web applications.',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: adminId,
        institution: 'State University',
        degree: 'Bachelor of Science',
        field_of_study: 'Software Engineering',
        start_date: '2011-09-01',
        end_date: '2015-05-30',
        description: 'Fundamental computer science and software engineering principles. Participated in numerous hackathons and coding competitions.',
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
      await queryInterface.bulkDelete('education', { user_id: adminId }, {});
      await queryInterface.bulkDelete('experience', { user_id: adminId }, {});
    }
  }
}; 