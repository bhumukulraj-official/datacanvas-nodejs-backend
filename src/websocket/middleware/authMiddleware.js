const jwtUtil = require('../../utils/jwt.util');
const { CustomError } = require('../../utils/error.util');

const authenticateWebsocket = (req, callback) => {
  try {
    const token = req.headers['sec-websocket-protocol']?.split(', ')[1];
    
    if (!token) {
      throw new CustomError('Authentication required', 401);
    }

    jwtUtil.verifyAccessToken(token)
      .then(decoded => {
        req.user = decoded;
        callback(null, decoded);
      })
      .catch(error => callback(error));
  } catch (error) {
    callback(error);
  }
};

module.exports = { authenticateWebsocket }; 