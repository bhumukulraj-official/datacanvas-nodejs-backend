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

    // Insert education records for each user
    return queryInterface.bulkInsert('education', [
      // Admin's education
      {
        user_id: userIds['admin'],
        institution: 'Massachusetts Institute of Technology',
        degree: 'Master of Science',
        field_of_study: 'Computer Science',
        start_date: '2015-09-01',
        end_date: '2017-05-30',
        description: 'Specialized in Software Engineering and Distributed Systems',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: userIds['admin'],
        institution: 'Stanford University',
        degree: 'Bachelor of Science',
        field_of_study: 'Computer Science',
        start_date: '2011-09-01',
        end_date: '2015-05-30',
        description: 'Focus on Web Technologies and Database Systems',
        created_at: new Date(),
        updated_at: new Date()
      },
      // John Doe's education
      {
        user_id: userIds['johndoe'],
        institution: 'University of California, Berkeley',
        degree: 'Bachelor of Science',
        field_of_study: 'Computer Science',
        start_date: '2012-09-01',
        end_date: '2016-05-30',
        description: 'Specialized in Web Development and User Interface Design',
        created_at: new Date(),
        updated_at: new Date()
      },
      // Jane Smith's education
      {
        user_id: userIds['janesmith'],
        institution: 'Rhode Island School of Design',
        degree: 'Bachelor of Fine Arts',
        field_of_study: 'Graphic Design',
        start_date: '2013-09-01',
        end_date: '2017-05-30',
        description: 'Focus on Digital Design and User Experience',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: userIds['janesmith'],
        institution: 'Parsons School of Design',
        degree: 'Master of Fine Arts',
        field_of_study: 'Design and Technology',
        start_date: '2017-09-01',
        end_date: '2019-05-30',
        description: 'Specialized in Interactive Design and User Research',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('education', null, {});
  }
}; 