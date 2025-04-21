'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const users = await queryInterface.sequelize.query(
      'SELECT id, username FROM users',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const userMap = users.reduce((acc, user) => {
      acc[user.username] = user.id;
      return acc;
    }, {});

    const profiles = [
      {
        user_id: userMap['admin'],
        title: 'Senior Software Engineer',
        bio: 'Experienced software engineer with a passion for building scalable applications',
        avatar_url: 'https://example.com/avatars/admin.jpg',
        phone: '+1234567890',
        location: 'San Francisco, CA',
        social_links: JSON.stringify({
          linkedin: 'https://linkedin.com/in/admin',
          github: 'https://github.com/admin',
          twitter: 'https://twitter.com/admin'
        }),
        resume_url: 'https://example.com/resumes/admin.pdf',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: userMap['johndoe'],
        title: 'Full Stack Developer',
        bio: 'Full stack developer specializing in React and Node.js',
        avatar_url: 'https://example.com/avatars/johndoe.jpg',
        phone: '+1234567891',
        location: 'New York, NY',
        social_links: JSON.stringify({
          linkedin: 'https://linkedin.com/in/johndoe',
          github: 'https://github.com/johndoe'
        }),
        resume_url: 'https://example.com/resumes/johndoe.pdf',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: userMap['janesmith'],
        title: 'UI/UX Designer',
        bio: 'Creative designer focused on user-centered design principles',
        avatar_url: 'https://example.com/avatars/janesmith.jpg',
        phone: '+1234567892',
        location: 'Los Angeles, CA',
        social_links: JSON.stringify({
          linkedin: 'https://linkedin.com/in/janesmith',
          dribbble: 'https://dribbble.com/janesmith'
        }),
        resume_url: 'https://example.com/resumes/janesmith.pdf',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('profiles', profiles, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('profiles', null, {});
  }
};