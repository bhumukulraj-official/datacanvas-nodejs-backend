'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('experience', [
      {
        user_id: 1, // admin_user
        title: 'Senior Full Stack Developer',
        company: 'Tech Innovations Inc.',
        start_date: '2020-06-01',
        end_date: null, // Current job
        description: 'Leading the development of enterprise SaaS applications using microservices architecture. Responsible for system design, implementation, and deployment pipelines. Mentoring junior developers and establishing best practices.',
        technologies: ['Node.js', 'React', 'Docker', 'Kubernetes', 'AWS'],
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 1, // admin_user
        title: 'Backend Developer',
        company: 'DataSystems Corp',
        start_date: '2017-07-15',
        end_date: '2020-05-30',
        description: 'Developed and maintained high-performance REST APIs and microservices. Implemented authentication systems and optimized database queries for scalability.',
        technologies: ['Node.js', 'Express', 'PostgreSQL', 'Redis', 'Docker'],
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 2, // editor_main
        title: 'Lead Technical Editor',
        company: 'TechDocs Publications',
        start_date: '2018-03-01',
        end_date: null, // Current job
        description: 'Managing a team of technical writers to produce high-quality documentation for software products. Developing style guides and establishing editorial processes. Working closely with engineering teams to ensure accuracy.',
        technologies: ['Markdown', 'AsciiDoc', 'Git', 'DITA', 'Jekyll'],
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 3, // writer_one
        title: 'Frontend Developer',
        company: 'WebSolutions LLC',
        start_date: '2019-01-15',
        end_date: null, // Current job
        description: 'Building responsive and accessible web applications with modern JavaScript frameworks. Implementing state management solutions and optimizing application performance.',
        technologies: ['React', 'TypeScript', 'Redux', 'Sass', 'Jest'],
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 4, // regular_user
        title: 'UX/UI Designer',
        company: 'DesignWorks Studio',
        start_date: '2019-06-01',
        end_date: null, // Current job
        description: 'Creating user-centered designs for web and mobile applications. Conducting user research, developing wireframes, prototypes, and hi-fidelity mockups. Collaborating with development teams to implement designs.',
        technologies: ['Figma', 'Adobe XD', 'Sketch', 'InVision', 'Zeplin'],
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 5, // content_creator
        title: 'Content Marketing Manager',
        company: 'LifestyleMedia Group',
        start_date: '2020-02-01',
        end_date: null, // Current job
        description: 'Developing and executing content marketing strategies across multiple channels. Creating engaging written and video content for lifestyle brand. Managing editorial calendar and analytics reporting.',
        technologies: ['Adobe Premier', 'WordPress', 'SEO Tools', 'Google Analytics', 'HubSpot'],
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 6, // inactive_user
        title: 'Digital Marketing Specialist',
        company: 'MarketBoost Agency',
        start_date: '2020-06-15',
        end_date: '2022-12-31',
        description: 'Implemented digital marketing campaigns across multiple platforms. Managed social media accounts, email marketing, and PPC advertising. Analyzed campaign performance and optimized for conversion.',
        technologies: ['Google Ads', 'Facebook Ads', 'Mailchimp', 'Hootsuite', 'Google Analytics'],
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 7, // suspended_user
        title: 'Data Analyst',
        company: 'DataMetrics Solutions',
        start_date: '2021-05-01',
        end_date: '2023-01-15',
        description: 'Analyzed large datasets to extract business insights. Created data visualizations and dashboards for stakeholders. Developed automated reporting solutions using Python and SQL.',
        technologies: ['Python', 'SQL', 'Tableau', 'Pandas', 'Excel'],
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('experience', null, {});
  }
}; 