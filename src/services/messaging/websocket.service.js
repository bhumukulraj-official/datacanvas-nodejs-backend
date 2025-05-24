const { WebsocketConnectionRepository, WebsocketMessageRepository } = require('../../data/repositories/messaging');
const { CustomError } = require('../../utils/error.util');

class WebsocketService {
  constructor() {
    this.connectionRepo = new WebsocketConnectionRepository();
    this.messageRepo = new WebsocketMessageRepository();
  }

  async trackConnection(userId, connectionId) {
    return this.connectionRepo.create({
      user_id: userId,
      connection_id: connectionId,
      connection_status: 'connected'
    });
  }

  async handleDisconnect(connectionId) {
    return this.connectionRepo.updateStatus(connectionId, 'disconnected');
  }

  async sendMessage(connectionId, message) {
    await this.messageRepo.create({
      connection_id: connectionId,
      message: JSON.stringify(message),
      direction: 'outgoing'
    });
    
    // TODO: Implement actual WebSocket send
    return true;
  }

  async logIncomingMessage(connectionId, message) {
    return this.messageRepo.create({
      connection_id: connectionId,
      message: JSON.stringify(message),
      direction: 'incoming'
    });
  }

  async getConnectionMessages(connectionId) {
    return this.messageRepo.getByConnectionId(connectionId);
  }
}

module.exports = new WebsocketService(); 