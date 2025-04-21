'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const contactSubmissions = [
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        subject: 'Project Inquiry',
        message: 'I would like to discuss a potential project collaboration.',
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        subject: 'Partnership Opportunity',
        message: 'We are looking for a development partner for our startup.',
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Michael Brown',
        email: 'michael.b@example.com',
        subject: 'Job Application',
        message: 'I am interested in joining your development team.',
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('contact_submissions', contactSubmissions, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('contact_submissions', null, {});
  }
}; 