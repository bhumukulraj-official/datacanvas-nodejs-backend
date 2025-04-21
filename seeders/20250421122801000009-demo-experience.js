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

    // Insert experience records for each user
    return queryInterface.bulkInsert('experience', [
      // Admin's experience
      {
        user_id: userIds['admin'],
        title: 'Senior Full Stack Developer',
        company: 'Tech Corp',
        start_date: '2020-01-01',
        end_date: null,
        description: 'Leading development of enterprise web applications using Node.js and React',
        technologies: ['Node.js', 'React', 'TypeScript', 'PostgreSQL', 'Redis'],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: userIds['admin'],
        title: 'Full Stack Developer',
        company: 'StartupX',
        start_date: '2017-06-01',
        end_date: '2019-12-31',
        description: 'Developed and maintained multiple web applications',
        technologies: ['Node.js', 'React', 'MongoDB', 'AWS'],
        created_at: new Date(),
        updated_at: new Date()
      },
      // John Doe's experience
      {
        user_id: userIds['johndoe'],
        title: 'Frontend Developer',
        company: 'WebTech Solutions',
        start_date: '2019-03-01',
        end_date: null,
        description: 'Building responsive and interactive web applications',
        technologies: ['React', 'JavaScript', 'TypeScript', 'Redux'],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: userIds['johndoe'],
        title: 'Junior Web Developer',
        company: 'Digital Agency',
        start_date: '2016-07-01',
        end_date: '2019-02-28',
        description: 'Developed and maintained client websites',
        technologies: ['JavaScript', 'jQuery', 'HTML', 'CSS'],
        created_at: new Date(),
        updated_at: new Date()
      },
      // Jane Smith's experience
      {
        user_id: userIds['janesmith'],
        title: 'Senior UI/UX Designer',
        company: 'Design Studio',
        start_date: '2019-01-01',
        end_date: null,
        description: 'Leading design team and creating user-centered interfaces',
        technologies: ['Figma', 'Sketch', 'Adobe XD', 'InVision'],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: userIds['janesmith'],
        title: 'UI Designer',
        company: 'Creative Agency',
        start_date: '2017-06-01',
        end_date: '2018-12-31',
        description: 'Designed user interfaces for web and mobile applications',
        technologies: ['Sketch', 'Adobe Creative Suite', 'InVision'],
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('experience', null, {});
  }
}; 