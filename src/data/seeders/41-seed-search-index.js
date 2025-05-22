'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Check if the search index table exists and its structure
        const [tableExists] = await queryInterface.sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'content' 
            AND table_name = 'search_index'
          ) as exists;
        `, { transaction: t });
        
        if (!tableExists[0].exists) {
          console.log('Search index table does not exist, skipping');
          return;
        }

        // Check the columns to ensure we use the right structure
        const [tableColumns] = await queryInterface.sequelize.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'content' AND table_name = 'search_index'
          ORDER BY ordinal_position;
        `, { transaction: t });
        
        const columns = tableColumns.map(col => col.column_name);
        console.log('Available columns in search_index:', columns);
        
        // Get data from various tables to build search index
        const [projects] = await queryInterface.sequelize.query(`
          SELECT 
            id, 
            'project' as entity_type, 
            title, 
            description, 
            COALESCE(technologies, '{}') as keywords,
            thumbnail_url
          FROM content.projects 
          WHERE is_deleted = FALSE
          LIMIT 10;
        `, { transaction: t });
        
        const [profiles] = await queryInterface.sequelize.query(`
          SELECT 
            id, 
            'profile' as entity_type, 
            COALESCE(title, '') as title, 
            COALESCE(bio, '') as description, 
            '{}'::text[] as keywords,
            avatar_url as thumbnail_url
          FROM content.profiles 
          WHERE is_deleted = FALSE
          LIMIT 10;
        `, { transaction: t });
        
        const [skills] = await queryInterface.sequelize.query(`
          SELECT 
            id, 
            'skill' as entity_type, 
            name as title, 
            COALESCE(description, '') as description, 
            ARRAY[category] as keywords,
            NULL as thumbnail_url
          FROM content.skills 
          WHERE is_deleted = FALSE
          LIMIT 10;
        `, { transaction: t });
        
        // Clear existing search index data if any exists
        await queryInterface.sequelize.query(`
          TRUNCATE content.search_index RESTART IDENTITY;
        `, { transaction: t });
        
        // Combine all records
        const allRecords = [...projects, ...profiles, ...skills];
        
        // Insert search index entries
        for (const record of allRecords) {
          // Generate search content - combination of title, description, and keywords
          const searchContent = [
            record.title,
            record.description,
            ...(Array.isArray(record.keywords) ? record.keywords : [])
          ].filter(Boolean).join(' ');
          
          // Generate metadata
          const metadata = JSON.stringify({
            title: record.title,
            thumbnail_url: record.thumbnail_url,
            priority: record.entity_type === 'project' ? 10 : (record.entity_type === 'profile' ? 5 : 3)
          });
          
          // Insert using the correct columns
          await queryInterface.sequelize.query(`
            INSERT INTO content.search_index (
              entity_type, entity_id, search_vector, metadata
            ) VALUES (
              '${record.entity_type}',
              ${record.id},
              to_tsvector('english', '${searchContent.replace(/'/g, "''")}'),
              '${metadata.replace(/'/g, "''")}'::jsonb
            );
          `, { transaction: t });
        }
        
        console.log(`Added ${allRecords.length} entries to search index`);
      } catch (error) {
        console.error('Error in search index seeder:', error.message);
        throw error;
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Check if the search index table exists
        const [tableExists] = await queryInterface.sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'content' 
            AND table_name = 'search_index'
          ) as exists;
        `, { transaction: t });
        
        if (!tableExists[0].exists) {
          console.log('Search index table does not exist, skipping');
          return;
        }
        
        // Clear the search index
        await queryInterface.sequelize.query(`
          TRUNCATE content.search_index RESTART IDENTITY;
        `, { transaction: t });
        
      } catch (error) {
        console.error('Error in search index down migration:', error.message);
        throw error;
      }
    });
  }
};
