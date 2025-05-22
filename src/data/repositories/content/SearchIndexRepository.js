const BaseRepository = require('../BaseRepository');
const { SearchIndex } = require('../../models');
const sequelize = require('../../../config/database');

class SearchIndexRepository extends BaseRepository {
  constructor() {
    super(SearchIndex);
  }

  async getByEntityTypeAndId(entityType, entityId) {
    return this.model.findOne({
      where: { entity_type: entityType, entity_id: entityId }
    });
  }

  async updateSearchVector(entityType, entityId, searchVector, metadata = {}) {
    const existingRecord = await this.getByEntityTypeAndId(entityType, entityId);
    
    if (existingRecord) {
      return this.update(existingRecord.id, { 
        search_vector: searchVector,
        metadata: { ...existingRecord.metadata, ...metadata }
      });
    } else {
      return this.create({
        entity_type: entityType,
        entity_id: entityId,
        search_vector: searchVector,
        metadata
      });
    }
  }

  async search(query, entityTypes = [], options = {}) {
    let whereClause = `search_vector @@ to_tsquery('english', :query)`;
    const replacements = { query: query.replace(/\s+/g, ' & ') };
    
    if (entityTypes.length > 0) {
      whereClause += ` AND entity_type IN (:entityTypes)`;
      replacements.entityTypes = entityTypes;
    }
    
    return sequelize.query(
      `SELECT * FROM content.search_index 
       WHERE ${whereClause}
       ORDER BY ts_rank(search_vector, to_tsquery('english', :query)) DESC
       LIMIT :limit OFFSET :offset`,
      {
        replacements: {
          ...replacements,
          limit: options.limit || 20,
          offset: options.offset || 0
        },
        type: sequelize.QueryTypes.SELECT,
        model: this.model
      }
    );
  }

  async deleteByEntityTypeAndId(entityType, entityId) {
    return this.model.destroy({
      where: { entity_type: entityType, entity_id: entityId }
    });
  }
}

module.exports = SearchIndexRepository; 