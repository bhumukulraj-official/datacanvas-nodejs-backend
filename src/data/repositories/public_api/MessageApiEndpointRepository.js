const BaseRepository = require('../BaseRepository');
const MessageApiEndpoint = require('../../models/public_api/MessageApiEndpoint');

class MessageApiEndpointRepository extends BaseRepository {
  constructor() {
    super(MessageApiEndpoint);
  }

  async findByEndpoint(endpoint) {
    return this.model.findOne({
      where: { endpoint }
    });
  }

  async findByMethod(method) {
    return this.model.findAll({
      where: { method },
      order: [['endpoint', 'ASC']]
    });
  }

  async findByTable(schemaName, tableName) {
    return this.model.findAll({
      where: { 
        schema_name: schemaName,
        table_name: tableName
      },
      order: [['endpoint', 'ASC']]
    });
  }
}

module.exports = new MessageApiEndpointRepository(); 