const BaseRepository = require('../BaseRepository');
const { StorageProvider } = require('../../models');

class StorageProviderRepository extends BaseRepository {
  constructor() {
    super(StorageProvider);
  }

  async getByCode(code) {
    return this.model.findOne({
      where: { code }
    });
  }

  async getActiveProviders() {
    return this.model.findAll({
      where: { is_active: true }
    });
  }

  async getDefaultProvider() {
    return this.model.findOne({
      where: { is_default: true, is_active: true }
    });
  }

  async setAsDefault(providerId) {
    // Clear default flag from all providers first
    await this.model.update(
      { is_default: false },
      { where: { is_default: true } }
    );
    
    // Set the requested provider as default
    return this.update(providerId, { is_default: true });
  }

  async updateConfiguration(providerId, configuration) {
    return this.update(providerId, { configuration });
  }

  async toggleActive(providerId, isActive) {
    return this.update(providerId, { is_active: isActive });
  }
}

module.exports = StorageProviderRepository; 