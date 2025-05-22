'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Get project IDs from existing data
      const [projects] = await queryInterface.sequelize.query(
        "SELECT id FROM content.projects",
        { transaction: t }
      );

      // Insert common tags for projects
      await queryInterface.sequelize.query(`
        -- Insert technology tags
        INSERT INTO content.tags (name, slug, category, is_technology)
        VALUES
          ('JavaScript', 'javascript', 'Programming Language', true),
          ('TypeScript', 'typescript', 'Programming Language', true),
          ('React', 'react', 'Frontend Framework', true),
          ('Node.js', 'nodejs', 'Backend Runtime', true),
          ('Express', 'express', 'Backend Framework', true),
          ('PostgreSQL', 'postgresql', 'Database', true),
          ('MongoDB', 'mongodb', 'Database', true),
          ('GraphQL', 'graphql', 'API', true),
          ('REST API', 'rest-api', 'API', true),
          ('Docker', 'docker', 'DevOps', true),
          ('AWS', 'aws', 'Cloud', true),
          ('Redux', 'redux', 'State Management', true),
          ('Tailwind CSS', 'tailwind-css', 'CSS Framework', true),
          ('Next.js', 'nextjs', 'Frontend Framework', true),
          ('Vue.js', 'vuejs', 'Frontend Framework', true)
        ON CONFLICT (name) DO NOTHING;
        
        -- Insert project category tags  
        INSERT INTO content.tags (name, slug, category, is_technology)
        VALUES
          ('E-commerce', 'e-commerce', 'Project Type', false),
          ('Portfolio', 'portfolio', 'Project Type', false),
          ('Dashboard', 'dashboard', 'Project Type', false),
          ('CMS', 'cms', 'Project Type', false),
          ('Mobile App', 'mobile-app', 'Project Type', false),
          ('Web Application', 'web-application', 'Project Type', false),
          ('Data Visualization', 'data-visualization', 'Feature', false),
          ('Authentication', 'authentication', 'Feature', false),
          ('Real-time', 'real-time', 'Feature', false),
          ('Responsive Design', 'responsive-design', 'Feature', false)
        ON CONFLICT (name) DO NOTHING;
      `, { transaction: t });

      // Get tag IDs
      const [tags] = await queryInterface.sequelize.query(
        "SELECT id, name FROM content.tags",
        { transaction: t }
      );

      // Map of tag names to IDs for easier reference
      const tagMap = {};
      tags.forEach(tag => {
        tagMap[tag.name] = tag.id;
      });

      // Associate tags with projects
      if (projects.length > 0) {
        // Project 1: E-commerce platform with React, Node.js, etc.
        await queryInterface.sequelize.query(`
          INSERT INTO content.project_tags (project_id, tag_id)
          VALUES 
            (${projects[0].id}, ${tagMap['JavaScript']}),
            (${projects[0].id}, ${tagMap['React']}),
            (${projects[0].id}, ${tagMap['Node.js']}),
            (${projects[0].id}, ${tagMap['PostgreSQL']}),
            (${projects[0].id}, ${tagMap['E-commerce']}),
            (${projects[0].id}, ${tagMap['REST API']}),
            (${projects[0].id}, ${tagMap['Authentication']})
          ON CONFLICT DO NOTHING;
        `, { transaction: t });
        
        // If we have more projects
        if (projects.length > 1) {
          // Project 2: Portfolio website with Next.js, etc.
          await queryInterface.sequelize.query(`
            INSERT INTO content.project_tags (project_id, tag_id)
            VALUES 
              (${projects[1].id}, ${tagMap['TypeScript']}),
              (${projects[1].id}, ${tagMap['Next.js']}),
              (${projects[1].id}, ${tagMap['Tailwind CSS']}),
              (${projects[1].id}, ${tagMap['Portfolio']}),
              (${projects[1].id}, ${tagMap['Responsive Design']})
            ON CONFLICT DO NOTHING;
          `, { transaction: t });
        }
        
        // If we have more projects
        if (projects.length > 2) {
          // Project 3: Dashboard with React, Redux, etc.
          await queryInterface.sequelize.query(`
            INSERT INTO content.project_tags (project_id, tag_id)
            VALUES 
              (${projects[2].id}, ${tagMap['JavaScript']}),
              (${projects[2].id}, ${tagMap['React']}),
              (${projects[2].id}, ${tagMap['Redux']}),
              (${projects[2].id}, ${tagMap['MongoDB']}),
              (${projects[2].id}, ${tagMap['Dashboard']}),
              (${projects[2].id}, ${tagMap['Data Visualization']}),
              (${projects[2].id}, ${tagMap['Real-time']})
            ON CONFLICT DO NOTHING;
          `, { transaction: t });
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Delete project tags first
      await queryInterface.sequelize.query(`
        DELETE FROM content.project_tags;
      `, { transaction: t });
      
      // Delete tags
      await queryInterface.sequelize.query(`
        DELETE FROM content.tags;
      `, { transaction: t });
    });
  }
}; 