'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get the admin user ID
    const [adminUser] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1;`
    );
    
    if (!adminUser || !adminUser.length) return;
    const adminId = adminUser[0].id;

    // Create testimonials
    await queryInterface.bulkInsert('testimonials', [
      {
        user_id: adminId,
        author_name: 'Jane Smith',
        author_title: 'CTO, TechStart Inc.',
        content: 'Working with this developer was an absolute pleasure. Their expertise in full-stack development helped us launch our platform in record time. Highly recommended for any complex web application project.',
        rating: 5,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: adminId,
        author_name: 'Michael Johnson',
        author_title: 'Product Manager, Digital Innovations',
        content: 'An exceptional developer who not only delivered high-quality code but also provided valuable insights that improved our product. Communication was excellent throughout the project.',
        rating: 5,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: adminId,
        author_name: 'Sarah Williams',
        author_title: 'Founder, CreativeHub',
        content: 'We hired this developer to revamp our website, and the results exceeded our expectations. They have a strong eye for design and technical expertise to match. Our site is now faster, more responsive, and much easier to manage.',
        rating: 4,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], {});

    // Create site settings
    await queryInterface.bulkInsert('settings', [
      {
        site_name: 'Developer Portfolio',
        site_description: 'Professional portfolio website showcasing web development skills, projects, and experience.',
        logo_url: 'logo.svg',
        favicon_url: 'favicon.ico',
        theme: JSON.stringify({
          primaryColor: '#3498db',
          secondaryColor: '#2c3e50',
          accentColor: '#e74c3c',
          backgroundColor: '#f9f9f9',
          textColor: '#333333',
          fontFamily: 'Roboto, sans-serif'
        }),
        contact_info: JSON.stringify({
          email: 'contact@example.com',
          phone: '+1 555 123 4567',
          address: 'San Francisco, CA'
        }),
        social_links: JSON.stringify({
          github: 'https://github.com/username',
          linkedin: 'https://linkedin.com/in/username',
          twitter: 'https://twitter.com/username'
        }),
        seo_settings: JSON.stringify({
          metaTitle: 'Developer Portfolio | Web Development Expert',
          metaDescription: 'Professional portfolio of a full-stack web developer specializing in React, Node.js, and modern web technologies.',
          ogImage: 'og-image.jpg',
          keywords: 'web developer, full stack, react, node.js, portfolio'
        }),
        analytics_settings: JSON.stringify({
          googleAnalyticsId: 'UA-XXXXXXXXX-X',
          enableAnalytics: true
        }),
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('settings', null, {});
    
    const [adminUser] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1;`
    );
    
    if (adminUser && adminUser.length > 0) {
      const adminId = adminUser[0].id;
      await queryInterface.bulkDelete('testimonials', { user_id: adminId }, {});
    }
  }
}; 