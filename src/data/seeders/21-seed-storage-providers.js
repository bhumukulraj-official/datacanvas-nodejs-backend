'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Insert storage providers
      await queryInterface.sequelize.query(`
        INSERT INTO content.storage_providers (
          code, name, provider_type, configuration, is_default, is_active
        ) VALUES
          ('local', 'Local Storage', 'local', 
          '{"basePath": "uploads/", "baseUrl": "/uploads/", "maxSizeInBytes": 52428800}', 
          true, true),
          
          ('s3', 'Amazon S3', 's3', 
          '{"region": "us-east-1", "bucket": "portfolio-assets", "baseUrl": "https://portfolio-assets.s3.amazonaws.com/", "acl": "public-read"}', 
          false, true),
          
          ('cloudinary', 'Cloudinary CDN', 'cloudinary', 
          '{"cloudName": "portfolio-cloud", "folder": "projects", "transformation": {"quality": "auto"}}', 
          false, true),
          
          ('firebase', 'Firebase Storage', 'firebase', 
          '{"storageBucket": "portfolio-app.appspot.com", "folder": "uploads"}', 
          false, false)
        ON CONFLICT (code) DO UPDATE 
        SET name = EXCLUDED.name,
            provider_type = EXCLUDED.provider_type,
            configuration = EXCLUDED.configuration,
            is_default = EXCLUDED.is_default,
            is_active = EXCLUDED.is_active;
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM content.storage_providers 
        WHERE code IN ('local', 's3', 'cloudinary', 'firebase');
      `, { transaction: t });
    });
  }
}; 