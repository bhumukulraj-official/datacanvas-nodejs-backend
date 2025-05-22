const BaseRepository = require('../BaseRepository');
const { Webhook } = require('../../models');
const { Op } = require('sequelize');

class WebhookRepository extends BaseRepository {
  constructor() {
    super(Webhook);
  }

  async findByUuid(uuid) {
    return this.model.findOne({ where: { uuid } });
  }

  async findByStatus(status) {
    return this.model.findAll({ where: { status } });
  }

  async findPendingWebhooks() {
    return this.model.findAll({
      where: {
        status: 'pending',
        [Op.or]: [
          { next_retry_at: null },
          { next_retry_at: { [Op.lte]: new Date() } }
        ]
      },
      order: [['created_at', 'ASC']]
    });
  }

  async incrementAttempt(webhookId, nextRetryAt = null) {
    const updateData = {
      attempts: this.model.sequelize.literal('attempts + 1')
    };
    
    if (nextRetryAt) {
      updateData.next_retry_at = nextRetryAt;
    }
    
    return this.update(webhookId, updateData);
  }

  async updateStatus(webhookId, status) {
    return this.update(webhookId, { status });
  }
}

module.exports = WebhookRepository; 