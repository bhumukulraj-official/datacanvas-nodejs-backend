'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        INSERT INTO content.skills (name, category, proficiency)
        VALUES
          ('JavaScript', 'Programming Language', 5),
          ('React', 'Frontend Framework', 4),
          ('Node.js', 'Backend Runtime', 4),
          ('PostgreSQL', 'Database', 3),
          ('TypeScript', 'Programming Language', 3);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM content.skills 
        WHERE name IN ('JavaScript', 'React', 'Node.js', 'PostgreSQL', 'TypeScript');
      `, { transaction: t });
    });
  }
}; 