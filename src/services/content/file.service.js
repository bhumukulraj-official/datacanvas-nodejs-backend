const { FileUploadRepository } = require('../../data/repositories/content');
const { s3 } = require('../../config');
const { CustomError } = require('../../utils/error.util');
const logger = require('../../utils/logger.util');

class FileService {
  constructor() {
    this.fileUploadRepo = new FileUploadRepository();
    logger.info('FileService initialized with repositories');
  }

  async createFileRecord(fileData) {
    try {
      return await this.fileUploadRepo.create(fileData);
    } catch (error) {
      logger.error('Error creating file record:', error);
      throw new CustomError('Failed to create file record', 500);
    }
  }

  async getFileByUuid(uuid) {
    const file = await this.fileUploadRepo.getByUuid(uuid);
    if (!file) {
      throw new CustomError('File not found', 404);
    }
    return file;
  }

  async generatePresignedUrl(fileId) {
    const file = await this.getFileByUuid(fileId);
    const command = new GetObjectCommand({
      Bucket: s3.getBucket(file.is_public),
      Key: file.s3_key
    });
    
    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
  }

  async markFileAsClean(fileId) {
    return this.fileUploadRepo.updateVirusScanStatus(fileId, 'clean');
  }

  async deleteFile(fileId) {
    const file = await this.getFileByUuid(fileId);
    await this.fileUploadRepo.markAsDeleted(fileId);
    
    const command = new DeleteObjectCommand({
      Bucket: s3.getBucket(file.is_public),
      Key: file.s3_key
    });
    
    await s3Client.send(command);
    return true;
  }
}

module.exports = new FileService(); 