const cors = require('cors');
const { cors: corsConfig } = require('../../config/security');

module.exports = cors({
  origin: corsConfig.origin,
  methods: corsConfig.methods,
  allowedHeaders: corsConfig.allowedHeaders,
  exposedHeaders: corsConfig.exposedHeaders,
  credentials: corsConfig.credentials,
  maxAge: corsConfig.maxAge
}); 