'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create the table within a transaction
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Storage Providers Table
        CREATE TABLE content.storage_providers (
          id SERIAL PRIMARY KEY,
          code VARCHAR(20) UNIQUE NOT NULL,
          name VARCHAR(50) NOT NULL,
          provider_type VARCHAR(20) CHECK (provider_type IN ('local', 's3', 'cloudinary', 'firebase', 'other')),
          configuration JSONB DEFAULT '{}',
          is_default BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Insert default storage provider
        INSERT INTO content.storage_providers (code, name, provider_type, is_default, is_active, configuration)
        VALUES ('local', 'Local Storage', 'local', TRUE, TRUE, '{"basePath": "uploads/", "baseUrl": "/uploads/"}');
        
        -- File Uploads Table
        CREATE TABLE content.file_uploads (
          id SERIAL PRIMARY KEY,
          uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
          user_id INT REFERENCES auth.users(id) ON DELETE SET NULL,
          original_filename VARCHAR(255) NOT NULL,
          storage_filename VARCHAR(255) NOT NULL,
          file_size BIGINT NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          file_extension VARCHAR(20),
          storage_provider_id INT REFERENCES content.storage_providers(id),
          storage_path TEXT NOT NULL,
          public_url TEXT,
          entity_type VARCHAR(50),
          entity_id INT,
          is_public BOOLEAN DEFAULT FALSE,
          metadata JSONB DEFAULT '{}',
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMPTZ
        );

        -- Indexes
        CREATE INDEX idx_file_uploads_user_id ON content.file_uploads(user_id);
        CREATE INDEX idx_file_uploads_entity ON content.file_uploads(entity_type, entity_id);
        CREATE INDEX idx_file_uploads_mime_type ON content.file_uploads(mime_type);
        CREATE INDEX idx_file_uploads_is_public ON content.file_uploads(is_public);
        CREATE INDEX idx_file_uploads_is_deleted ON content.file_uploads(is_deleted);
        CREATE INDEX idx_file_uploads_metadata ON content.file_uploads USING GIN(metadata);
        
        -- Add trigger for updated_at
        CREATE TRIGGER update_storage_providers_timestamp
        BEFORE UPDATE ON content.storage_providers
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
        
        CREATE TRIGGER update_file_uploads_timestamp
        BEFORE UPDATE ON content.file_uploads
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        -- Add validation columns
        ALTER TABLE content.file_uploads
        ADD COLUMN file_type_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN virus_scan_status VARCHAR(20) DEFAULT 'pending';
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS update_file_uploads_timestamp ON content.file_uploads;
        DROP TRIGGER IF EXISTS update_storage_providers_timestamp ON content.storage_providers;
        DROP TABLE IF EXISTS content.file_uploads CASCADE;
        DROP TABLE IF EXISTS content.storage_providers CASCADE;
      `, { transaction: t });
    });
  }
}; 