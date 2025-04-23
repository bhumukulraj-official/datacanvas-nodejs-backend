const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const { AppError } = require('../../../shared/errors');

// Define upload limits and directories
const UPLOAD_DIR = process.env.UPLOAD_TEMP_DIR || path.join(process.cwd(), 'uploads', 'temp');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const fileExt = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${fileExt}`);
  }
});

// File size limits by type (in bytes)
const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB for images
  document: 10 * 1024 * 1024, // 10MB for documents
  video: 50 * 1024 * 1024, // 50MB for videos
  audio: 20 * 1024 * 1024, // 20MB for audio
};

// File filter
const fileFilter = (req, file, cb) => {
  const mimetype = file.mimetype.toLowerCase();
  const fileType = req.body.type || req.query.type;
  
  if (!fileType) {
    return cb(new AppError('Media type is required', 400, 'VAL_001'), false);
  }
  
  // Validate by requested type and mime type
  switch (fileType) {
    case 'image':
      if (!mimetype.startsWith('image/')) {
        return cb(new AppError('Invalid image file. Supported formats: JPG, PNG, GIF, WebP', 400, 'FILE_002'), false);
      }
      break;
    case 'document':
      const docMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
      ];
      if (!docMimeTypes.includes(mimetype)) {
        return cb(new AppError('Invalid document file. Supported formats: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV', 400, 'FILE_002'), false);
      }
      break;
    case 'video':
      if (!mimetype.startsWith('video/')) {
        return cb(new AppError('Invalid video file. Supported formats: MP4, WebM, MOV', 400, 'FILE_002'), false);
      }
      break;
    case 'audio':
      if (!mimetype.startsWith('audio/')) {
        return cb(new AppError('Invalid audio file. Supported formats: MP3, WAV, OGG', 400, 'FILE_002'), false);
      }
      break;
    default:
      return cb(new AppError('Invalid media type. Supported types: image, document, video, audio', 400, 'VAL_001'), false);
  }
  
  // File size validation will be handled by multer limits
  cb(null, true);
};

/**
 * Create media upload middleware with dynamic file size limits
 * @param {string} fieldName - Form field name
 * @returns {Function} Multer middleware
 */
exports.uploadMedia = (fieldName = 'file') => {
  return (req, res, next) => {
    const fileType = req.body.type || req.query.type || 'image';
    
    // Determine file size limit
    const fileSize = FILE_SIZE_LIMITS[fileType] || FILE_SIZE_LIMITS.image;
    
    // Configure multer upload
    const upload = multer({
      storage,
      limits: {
        fileSize,
        files: 1
      },
      fileFilter
    }).single(fieldName);
    
    // Handle upload
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError(`File too large. Max size: ${fileSize / (1024 * 1024)}MB`, 400, 'FILE_001'));
        }
        return next(new AppError(`Upload error: ${err.message}`, 400, 'FILE_003'));
      } else if (err) {
        return next(err); // Pass AppError or other errors
      }
      
      // If no file was uploaded
      if (!req.file) {
        return next(new AppError('No file uploaded', 400, 'FILE_003'));
      }
      
      // Continue to next middleware
      next();
    });
  };
};

/**
 * Create batch media upload middleware
 * @param {string} fieldName - Form field name
 * @param {number} maxFiles - Maximum number of files to upload
 * @returns {Function} Multer middleware
 */
exports.uploadMultipleMedia = (fieldName = 'files', maxFiles = 5) => {
  return (req, res, next) => {
    const fileType = req.body.type || req.query.type || 'image';
    
    // Determine file size limit
    const fileSize = FILE_SIZE_LIMITS[fileType] || FILE_SIZE_LIMITS.image;
    
    // Configure multer upload
    const upload = multer({
      storage,
      limits: {
        fileSize,
        files: maxFiles
      },
      fileFilter
    }).array(fieldName, maxFiles);
    
    // Handle upload
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError(`File too large. Max size: ${fileSize / (1024 * 1024)}MB`, 400, 'FILE_001'));
        } else if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new AppError(`Too many files. Max: ${maxFiles}`, 400, 'FILE_005'));
        }
        return next(new AppError(`Upload error: ${err.message}`, 400, 'FILE_003'));
      } else if (err) {
        return next(err); // Pass AppError or other errors
      }
      
      // If no files were uploaded
      if (!req.files || req.files.length === 0) {
        return next(new AppError('No files uploaded', 400, 'FILE_003'));
      }
      
      // Continue to next middleware
      next();
    });
  };
}; 