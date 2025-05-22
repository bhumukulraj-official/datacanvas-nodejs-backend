'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        INSERT INTO public_api.contact_submissions (
          uuid, name, email, subject, message, ip_address, user_agent, 
          recaptcha_score, status, is_deleted, created_at, updated_at
        ) VALUES
          (
            uuid_generate_v4(), 
            'John Smith', 
            'john.smith@example.com', 
            'Project Inquiry', 
            'Hello, I am interested in discussing a potential web application project. We need a custom solution for our business management needs. Could you please provide information about your services and availability?', 
            '192.168.1.50', 
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 
            0.9, 
            'reviewed', 
            false, 
            NOW() - INTERVAL '3 days',
            NOW() - INTERVAL '2 days'
          ),
          (
            uuid_generate_v4(), 
            'Emma Johnson', 
            'emma.j@example.org', 
            'Website Redesign Quote', 
            'I represent a small business looking to redesign our current website. It was built about five years ago and needs a modern refresh. We are particularly interested in improving mobile responsiveness and adding e-commerce capabilities. What would be your timeline and approximate cost for such a project?', 
            '192.168.1.51', 
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15', 
            0.95, 
            'replied', 
            false, 
            NOW() - INTERVAL '5 days',
            NOW() - INTERVAL '4 days'
          ),
          (
            uuid_generate_v4(), 
            'Michael Brown', 
            'michael.brown@example.net', 
            'Mobile App Development', 
            'We are looking to create a companion mobile app for our existing web platform. The app would need to provide core functionality from our service with offline capabilities. Do you have experience with React Native or Flutter development? I would appreciate a consultation to discuss our requirements in more detail.', 
            '192.168.1.52', 
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1', 
            0.87, 
            'pending', 
            false, 
            NOW() - INTERVAL '1 day',
            NOW() - INTERVAL '1 day'
          ),
          (
            uuid_generate_v4(), 
            'Sarah Williams', 
            'sarah.williams@example.co', 
            'Technical Support', 
            'I am having issues with the website you developed for us last year. The contact form is not sending emails and we are missing potential leads. This is quite urgent as it affects our business. Please advise on how to fix this issue or schedule a maintenance appointment.', 
            '192.168.1.53', 
            'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1', 
            0.92, 
            'reviewed', 
            false, 
            NOW() - INTERVAL '2 days',
            NOW() - INTERVAL '1 day'
          ),
          (
            uuid_generate_v4(), 
            'Robert Davis', 
            'robert.davis@example.biz', 
            'SEO Consultation', 
            'Our company is looking to improve our search engine rankings. We currently have a WordPress site but are not getting the visibility we need. Do you offer SEO services in addition to web development? If so, I would like to schedule a call to discuss a potential audit and ongoing optimization strategy.', 
            '192.168.1.54', 
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/91.0.864.67', 
            0.78, 
            'spam', 
            true, 
            NOW() - INTERVAL '7 days',
            NOW() - INTERVAL '6 days'
          );
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM public_api.contact_submissions
        WHERE email IN (
          'john.smith@example.com',
          'emma.j@example.org',
          'michael.brown@example.net',
          'sarah.williams@example.co',
          'robert.davis@example.biz'
        );
      `, { transaction: t });
    });
  }
}; 