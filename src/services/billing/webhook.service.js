const { WebhookRepository } = require('../../../data/repositories/billing');
const { CustomError } = require('../../utils/error.util');

class WebhookService {
  constructor() {
    this.webhookRepo = new WebhookRepository();
  }

  async processIncomingWebhook(payload, signature) {
    // TODO: Verify signature with provider
    const webhook = await this.webhookRepo.create({
      payload: JSON.stringify(payload),
      status: 'processed',
      attempts: 1
    });

    try {
      // TODO: Route webhook to appropriate handler
      return this.webhookRepo.updateStatus(webhook.id, 'processed');
    } catch (error) {
      return this.webhookRepo.updateStatus(webhook.id, 'failed');
    }
  }

  async retryFailedWebhooks() {
    const failedWebhooks = await this.webhookRepo.findPendingWebhooks();
    return Promise.all(
      failedWebhooks.map(webhook => 
        this.processWebhook(webhook)
          .catch(error => {
            this.webhookRepo.incrementAttempt(webhook.id);
          })
      )
    );
  }

  async processWebhook(webhook) {
    // TODO: Implement actual webhook processing
    return this.webhookRepo.updateStatus(webhook.id, 'processed');
  }
}

module.exports = new WebhookService(); 