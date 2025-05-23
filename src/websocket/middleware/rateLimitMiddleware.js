const { RateLimitRepository } = require('../../data/repositories/public_api');
const { CustomError } = require('../../utils/error.util');

const websocketRateLimit = async (user, type) => {
  const limits = await RateLimitRepository.findByEntityType('websocket');
  const userLimit = limits.find(l => l.entity_identifier === type);
  
  if (userLimit) {
    const count = await WebsocketMessageRepository.countRecentMessages(
      user.id, 
      type,
      userLimit.windowMs
    );
    
    if (count >= userLimit.maxRequests) {
      throw new CustomError('Rate limit exceeded', 429);
    }
  }
};

module.exports = websocketRateLimit; 