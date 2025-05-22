const BaseRepository = require('../BaseRepository');
const ApiDocumentation = require('../../models/public_api/ApiDocumentation');

class ApiDocumentationRepository extends BaseRepository {
  constructor() {
    super(ApiDocumentation);
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

  async findByApiVersion(apiVersion) {
    return this.model.findAll({
      where: { api_version: apiVersion },
      order: [['endpoint', 'ASC']]
    });
  }
}

module.exports = new ApiDocumentationRepository(); 