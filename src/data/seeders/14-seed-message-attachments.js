'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        INSERT INTO messaging.message_attachments (
          message_id, file_url, filename, file_type
        ) VALUES
          (1, '/attachments/project1/spec.pdf', 'tech-spec.pdf', 'application/pdf'),
          (2, '/attachments/project2/design.fig', 'design-mockup.fig', 'application/fig');
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM messaging.message_attachments 
        WHERE file_url IN (
          '/attachments/project1/spec.pdf',
          '/attachments/project2/design.fig'
        );
      `, { transaction: t });
    });
  }
}; 