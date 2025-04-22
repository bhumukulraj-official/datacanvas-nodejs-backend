'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('skills', [
      {
        user_id: 1, // admin_user
        name: 'JavaScript',
        category: 'Programming Languages',
        proficiency: 95,
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
        is_highlighted: true,
        display_order: 1,
        description: 'Advanced JavaScript programming including ES6+ features, async/await, and functional programming patterns.',
        years_of_experience: 8.5,
        last_used_date: new Date(),
        certification_url: 'https://certifications.example.com',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 1, // admin_user
        name: 'Node.js',
        category: 'Backend',
        proficiency: 90,
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
        is_highlighted: true,
        display_order: 2,
        description: 'Building scalable server-side applications with Node.js, Express, and various middleware.',
        years_of_experience: 6.0,
        last_used_date: new Date(),
        certification_url: 'https://nodejs.example.com',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 2, // editor_main
        name: 'Content Strategy',
        category: 'Content Creation',
        proficiency: 95,
        icon: 'https://example.com/icons/content-strategy.svg',
        is_highlighted: true,
        display_order: 1,
        description: 'Development and execution of comprehensive content strategies for blogs, documentation, and social media.',
        years_of_experience: 7.5,
        last_used_date: new Date(),
        certification_url: 'https://content.example.com',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 3, // writer_one
        name: 'React',
        category: 'Frontend',
        proficiency: 88,
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
        is_highlighted: true,
        display_order: 1,
        description: 'Building interactive user interfaces with React, Redux, and modern React patterns including hooks.',
        years_of_experience: 4.5,
        last_used_date: new Date(),
        certification_url: 'https://react.example.com',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 4, // regular_user
        name: 'UI/UX Design',
        category: 'Design',
        proficiency: 90,
        icon: 'https://example.com/icons/ui-ux.svg',
        is_highlighted: true,
        display_order: 1,
        description: 'Creating user-centered designs with focus on accessibility, usability, and modern design principles.',
        years_of_experience: 5.0,
        last_used_date: new Date(),
        certification_url: 'https://design.example.com',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 5, // content_creator
        name: 'Video Production',
        category: 'Multimedia',
        proficiency: 85,
        icon: 'https://example.com/icons/video-production.svg',
        is_highlighted: true,
        display_order: 1,
        description: 'Full-cycle video production including scripting, filming, editing, and publishing to various platforms.',
        years_of_experience: 3.5,
        last_used_date: new Date(),
        certification_url: 'https://video.example.com',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 6, // inactive_user
        name: 'Digital Marketing',
        category: 'Marketing',
        proficiency: 80,
        icon: 'https://example.com/icons/digital-marketing.svg',
        is_highlighted: false,
        display_order: 1,
        description: 'Implementation of digital marketing strategies across various channels including social media and email.',
        years_of_experience: 3.0,
        last_used_date: new Date(new Date().setMonth(new Date().getMonth() - 6)), // 6 months ago
        certification_url: 'https://marketing.example.com',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 7, // suspended_user
        name: 'Python',
        category: 'Programming Languages',
        proficiency: 75,
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
        is_highlighted: false,
        display_order: 1,
        description: 'Python programming for data analysis and web applications.',
        years_of_experience: 2.0,
        last_used_date: new Date(new Date().setMonth(new Date().getMonth() - 2)), // 2 months ago
        certification_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('skills', null, {});
  }
}; 