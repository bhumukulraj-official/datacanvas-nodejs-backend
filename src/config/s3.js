require('dotenv').config();
const { S3Client } = require('@aws-sdk/client-s3');

// S3 Configuration
const s3Config = {
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
};

// For MinIO or custom S3-compatible storage
if (process.env.S3_ENDPOINT) {
  s3Config.endpoint = process.env.S3_ENDPOINT;
}

// Create S3 client
const s3Client = new S3Client(s3Config);

// Bucket configuration
const bucketConfig = {
  mainBucket: process.env.S3_BUCKET || 'portfolio-files',
  publicBucket: process.env.S3_PUBLIC_BUCKET || 'portfolio-public',
  tempBucket: process.env.S3_TEMP_BUCKET || 'portfolio-temp',
  expiryTime: parseInt(process.env.S3_URL_EXPIRY || '3600', 10), // Default to 1 hour
};

module.exports = {
  client: s3Client,
  config: s3Config,
  bucket: bucketConfig,
  getClient: () => s3Client,
  
  // Utility to get the appropriate bucket based on visibility
  getBucket: (isPublic = false) => isPublic ? bucketConfig.publicBucket : bucketConfig.mainBucket,
  
  // Get the full S3 key with appropriate prefix
  getFullKey: (key, prefix = '') => prefix ? `${prefix}/${key}` : key,
  
  // Get base URL
  getBaseUrl: () => process.env.S3_BASE_URL || `https://${bucketConfig.publicBucket}.s3.${s3Config.region}.amazonaws.com`,
}; 