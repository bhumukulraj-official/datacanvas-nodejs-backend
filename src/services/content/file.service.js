const { FileUploadRepository } = require('../../../data/repositories/content');
const { s3 } = require('../../config');
const { CustomError } = require('../../utils/error.util');

class FileService {
  constructor() {
    this.fileRepo = new FileUploadRepository();
  }

  async createFileRecord(fileData) {
    return this.fileRepo.create({
      ...fileData,
      virus_scan_status: 'pending'
    });
  }

  async getFileByUuid(uuid) {
    const file = await this.fileRepo.getByUuid(uuid);
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
    return this.fileRepo.updateVirusScanStatus(fileId, 'clean');
  }

  async deleteFile(fileId) {
    const file = await this.getFileByUuid(fileId);
    await this.fileRepo.markAsDeleted(fileId);
    
    const command = new DeleteObjectCommand({
      Bucket: s3.getBucket(file.is_public),
      Key: file.s3_key
    });
    
    await s3Client.send(command);
    return true;
  }
}

module.exports = new FileService(); 