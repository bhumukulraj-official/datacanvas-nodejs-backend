const BaseRepository = require('../BaseRepository');
const { InvoiceTemplate } = require('../../models');

class InvoiceTemplateRepository extends BaseRepository {
  constructor() {
    super(InvoiceTemplate);
  }

  async getDefaultTemplate() {
    return this.model.findOne({ where: { is_default: true } });
  }

  async findByName(name) {
    return this.model.findOne({ where: { name } });
  }

  async setAsDefault(templateId) {
    // First, unset all defaults
    await this.model.update(
      { is_default: false },
      { where: { is_default: true } }
    );
    
    // Then set the new default
    return this.update(templateId, { is_default: true });
  }
}

module.exports = InvoiceTemplateRepository; 