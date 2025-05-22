'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Get users for file uploads
      const [users] = await queryInterface.sequelize.query(
        "SELECT id FROM auth.users LIMIT 3",
        { transaction: t }
      );

      // Get projects for entity references
      const [projects] = await queryInterface.sequelize.query(
        "SELECT id FROM content.projects LIMIT 2",
        { transaction: t }
      );

      // Get storage provider IDs
      const [storageProviders] = await queryInterface.sequelize.query(
        "SELECT id, code FROM content.storage_providers",
        { transaction: t }
      );

      // Find the local storage provider or default to the first one
      const localProvider = storageProviders.find(provider => provider.code === 'local') || storageProviders[0];

      // Insert file uploads
      await queryInterface.sequelize.query(`
        INSERT INTO content.file_uploads (
          uuid, user_id, original_filename, storage_filename, file_size, mime_type, 
          file_extension, storage_provider_id, storage_path, public_url, 
          entity_type, entity_id, is_public, metadata, file_type_verified, 
          virus_scan_status
        ) VALUES
          (uuid_generate_v4(), ${users[0].id}, 'project-proposal.pdf', 
          'project1_${Date.now()}_proposal.pdf', 245890, 'application/pdf', 
          'pdf', ${localProvider.id}, 'projects/${projects[0].id}/', 
          '/uploads/projects/${projects[0].id}/project1_${Date.now()}_proposal.pdf', 
          'project', ${projects[0].id}, false, 
          '{"pages": 5, "author": "John Smith"}', true, 'clean'),
          
          (uuid_generate_v4(), ${users[0].id}, 'mockup-design.png', 
          'project1_${Date.now()}_mockup.png', 1245890, 'image/png', 
          'png', ${localProvider.id}, 'projects/${projects[0].id}/', 
          '/uploads/projects/${projects[0].id}/project1_${Date.now()}_mockup.png', 
          'project', ${projects[0].id}, true, 
          '{"width": 1920, "height": 1080, "dpi": 72}', true, 'clean'),
          
          (uuid_generate_v4(), ${users[1].id}, 'requirements-doc.docx', 
          'project2_${Date.now()}_requirements.docx', 387654, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
          'docx', ${localProvider.id}, 'projects/${projects[1].id}/', 
          '/uploads/projects/${projects[1].id}/project2_${Date.now()}_requirements.docx', 
          'project', ${projects[1].id}, false, 
          '{"pages": 12, "author": "Client Team"}', true, 'clean'),
          
          (uuid_generate_v4(), ${users[2].id}, 'profile-photo.jpg', 
          'profile_${users[2].id}_${Date.now()}.jpg', 145678, 'image/jpeg', 
          'jpg', ${localProvider.id}, 'profiles/${users[2].id}/', 
          '/uploads/profiles/${users[2].id}/profile_${users[2].id}_${Date.now()}.jpg', 
          'profile', ${users[2].id}, true, 
          '{"width": 800, "height": 800, "dpi": 300}', true, 'clean'),
          
          (uuid_generate_v4(), ${users[0].id}, 'contract.pdf', 
          'project1_${Date.now()}_contract.pdf', 567890, 'application/pdf', 
          'pdf', ${localProvider.id}, 'projects/${projects[0].id}/contracts/', 
          '/uploads/projects/${projects[0].id}/contracts/project1_${Date.now()}_contract.pdf', 
          'project', ${projects[0].id}, false, 
          '{"pages": 8, "signed": true, "contract_type": "service_agreement"}', true, 'clean');
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM content.file_uploads 
        WHERE id IN (
          SELECT id FROM content.file_uploads
          ORDER BY created_at DESC
          LIMIT 5
        );
      `, { transaction: t });
    });
  }
}; 