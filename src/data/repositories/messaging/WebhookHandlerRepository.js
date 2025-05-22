const BaseRepository = require('../BaseRepository');
const { WebhookHandler } = require('../../models');
const { Op } = require('sequelize');

class WebhookHandlerRepository extends BaseRepository {
  constructor() {
    super(WebhookHandler);
  }

  async getActiveHandlers() {
    return this.model.findAll({
      where: { is_active: true },
      order: [['priority', 'ASC']]
    });
  }

  async getByEventType(eventType) {
    return this.model.findOne({
      where: { event_type: eventType }
    });
  }

  async getActiveHandlersByEventType(eventType) {
    return this.model.findAll({
      where: {
        event_type: eventType,
        is_active: true
      },
      order: [['priority', 'ASC']]
    });
  }

  async toggleActive(eventType, isActive) {
    return this.model.update(
      { is_active: isActive },
      { where: { event_type: eventType } }
    );
  }

  async updatePriority(eventType, priority) {
    return this.model.update(
      { priority },
      { where: { event_type: eventType } }
    );
  }
}

module.exports = WebhookHandlerRepository; 