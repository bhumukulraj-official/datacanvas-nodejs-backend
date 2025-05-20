'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      const [projects] = await queryInterface.sequelize.query(
        "SELECT id FROM content.projects",
        { transaction: t }
      );
      const [users] = await queryInterface.sequelize.query(
        "SELECT id FROM auth.users",
        { transaction: t }
      );

      await queryInterface.sequelize.query(`
        INSERT INTO content.project_files (
          project_id, uploaded_by, file_url, filename, file_type, description
        ) VALUES
          (${projects[0].id}, ${users[0].id}, 
          '/uploads/project1/tech-spec.pdf', 
          'tech-spec.pdf', 
          'application/pdf', 
          'Technical specification'),
          
          (${projects[1].id}, ${users[1].id}, 
          '/uploads/project2/design-mockup.fig', 
          'design-mockup.fig', 
          'application/fig', 
          'Figma design file'),
          
          (${projects[2].id}, ${users[0].id}, 
          '/uploads/project3/requirements.docx', 
          'requirements.docx', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
          'Client requirements');
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM content.project_files 
        WHERE file_url IN (
          '/uploads/project1/tech-spec.pdf',
          '/uploads/project2/design-mockup.fig',
          '/uploads/project3/requirements.docx'
        );
      `, { transaction: t });
    });
  }
}; 