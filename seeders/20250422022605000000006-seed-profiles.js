'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('profiles', [
      {
        user_id: 1, // admin_user
        title: 'Full Stack Developer & System Administrator',
        bio: 'Experienced full stack developer with expertise in web applications and system administration. Skilled in Node.js, React, and cloud infrastructure.',
        avatar_url: 'https://randomuser.me/api/portraits/men/1.jpg',
        phone: '+12025550187',
        location: 'San Francisco, CA',
        social_links: JSON.stringify({
          linkedin: 'https://linkedin.com/in/admin-user',
          github: 'https://github.com/admin-user',
          twitter: 'https://twitter.com/admin_user'
        }),
        resume_url: 'https://example.com/resumes/admin_user_resume.pdf',
        website: 'https://adminuser.dev',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 2, // editor_main
        title: 'Senior Content Editor & Technical Writer',
        bio: 'Professional content editor with over 8 years of experience in technical documentation and blog content creation.',
        avatar_url: 'https://randomuser.me/api/portraits/women/2.jpg',
        phone: '+12025550142',
        location: 'Boston, MA',
        social_links: JSON.stringify({
          linkedin: 'https://linkedin.com/in/editor-main',
          medium: 'https://medium.com/@editor_main'
        }),
        resume_url: 'https://example.com/resumes/editor_main_resume.pdf',
        website: 'https://editormain.com',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 3, // writer_one
        title: 'Technology Writer & Software Engineer',
        bio: 'Software engineer by day, technology writer by night. Passionate about explaining complex technical concepts in simple terms.',
        avatar_url: 'https://randomuser.me/api/portraits/men/3.jpg',
        phone: '+12025550163',
        location: 'Austin, TX',
        social_links: JSON.stringify({
          linkedin: 'https://linkedin.com/in/writer-one',
          github: 'https://github.com/writer-one',
          dev: 'https://dev.to/writer_one'
        }),
        resume_url: 'https://example.com/resumes/writer_one_resume.pdf',
        website: 'https://writerone.dev',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 4, // regular_user
        title: 'UX Designer',
        bio: 'User experience designer focused on creating intuitive and accessible web interfaces.',
        avatar_url: 'https://randomuser.me/api/portraits/women/4.jpg',
        phone: '+12025550198',
        location: 'Portland, OR',
        social_links: JSON.stringify({
          linkedin: 'https://linkedin.com/in/regular-user',
          dribbble: 'https://dribbble.com/regular_user',
          behance: 'https://behance.net/regular_user'
        }),
        resume_url: 'https://example.com/resumes/regular_user_resume.pdf',
        website: 'https://regularuser.design',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 5, // content_creator
        title: 'Digital Content Creator & Lifestyle Coach',
        bio: 'Lifestyle blogger and digital content creator specializing in wellness, productivity, and personal growth.',
        avatar_url: 'https://randomuser.me/api/portraits/men/5.jpg',
        phone: '+12025550175',
        location: 'Miami, FL',
        social_links: JSON.stringify({
          linkedin: 'https://linkedin.com/in/content-creator',
          instagram: 'https://instagram.com/content_creator',
          youtube: 'https://youtube.com/c/ContentCreator'
        }),
        resume_url: 'https://example.com/resumes/content_creator_resume.pdf',
        website: 'https://contentcreator.life',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 6, // inactive_user
        title: 'Former Marketing Specialist',
        bio: 'Digital marketing specialist currently on sabbatical.',
        avatar_url: 'https://randomuser.me/api/portraits/women/6.jpg',
        phone: '+12025550111',
        location: 'Chicago, IL',
        social_links: JSON.stringify({
          linkedin: 'https://linkedin.com/in/inactive-user'
        }),
        resume_url: null,
        website: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 7, // suspended_user
        title: 'Account Under Review',
        bio: 'This account is currently under review for policy violations.',
        avatar_url: 'https://randomuser.me/api/portraits/men/7.jpg',
        phone: null,
        location: 'New York, NY',
        social_links: JSON.stringify({}),
        resume_url: null,
        website: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 8, // deleted_user
        title: 'Former Community Member',
        bio: 'This profile has been deactivated.',
        avatar_url: null,
        phone: null,
        location: null,
        social_links: JSON.stringify({}),
        resume_url: null,
        website: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: new Date() // This profile is soft-deleted
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('profiles', null, {});
  }
}; 