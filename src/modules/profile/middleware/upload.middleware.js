const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ValidationError, FileError } = require('../../../shared/errors');
const fileType = require('file-type');
const crypto = require('crypto');

// Make sure upload directories exist
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const avatarUploadDir = path.join(process.cwd(), 'uploads/avatars');
const resumeUploadDir = path.join(process.cwd(), 'uploads/resumes');

ensureDirectoryExists(avatarUploadDir);
ensureDirectoryExists(resumeUploadDir);

// Avatar storage configuration
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarUploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a secure random filename with original extension
    const randomName = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    cb(null, `${req.user.id}-${timestamp}-${randomName}${extension}`);
  }
});

// Resume storage configuration
const resumeStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, resumeUploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a secure random filename with original extension
    const randomName = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    cb(null, `${req.user.id}-${timestamp}-${randomName}${extension}`);
  }
});

// Avatar file filter with enhanced security
const avatarFileFilter = async (req, file, cb) => {
  try {
    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const extension = path.extname(file.originalname).toLowerCase();
    
    if (!allowedExtensions.includes(extension)) {
      return cb(new ValidationError(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`), false);
    }
    
    // Limit file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
      return cb(new ValidationError(`File too large. Maximum size: 5MB`), false);
    }
    
    // Deeper file type check will be done after upload
    return cb(null, true);
  } catch (error) {
    return cb(new FileError(`Error validating file: ${error.message}`), false);
  }
};

// Resume file filter with enhanced security
const resumeFileFilter = async (req, file, cb) => {
  try {
    // Check file extension
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const extension = path.extname(file.originalname).toLowerCase();
    
    if (!allowedExtensions.includes(extension)) {
      return cb(new ValidationError(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`), false);
    }
    
    // Limit file size (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
      return cb(new ValidationError(`File too large. Maximum size: 10MB`), false);
    }
    
    // Deeper file type check will be done after upload
    return cb(null, true);
  } catch (error) {
    return cb(new FileError(`Error validating file: ${error.message}`), false);
  }
};

// Create upload instances
const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const resumeUpload = multer({
  storage: resumeStorage,
  fileFilter: resumeFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware for avatar upload with additional validation
exports.handleAvatarUpload = [
  avatarUpload.single('avatar'),
  async (req, res, next) => {
    if (!req.file) {
      return next(new ValidationError('No file uploaded or file upload failed'));
    }
    
    try {
      // Additional file type checking using file-type library
      const fileBuffer = fs.readFileSync(req.file.path);
      const detectedType = await fileType.fromBuffer(fileBuffer);
      
      // Validate the actual file content matches allowed image types
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      
      if (!detectedType || !validMimeTypes.includes(detectedType.mime)) {
        // Delete the invalid file
        fs.unlinkSync(req.file.path);
        return next(new ValidationError('Invalid file content. Only JPEG, PNG, and WebP images are allowed.'));
      }
      
      // If file is valid, continue
      next();
    } catch (error) {
      // Delete the file if validation fails
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting invalid file:', unlinkError);
        }
      }
      
      return next(new FileError(`Error processing file: ${error.message}`));
    }
  }
];

// Middleware for resume upload with additional validation
exports.handleResumeUpload = [
  resumeUpload.single('resume'),
  async (req, res, next) => {
    if (!req.file) {
      return next(new ValidationError('No file uploaded or file upload failed'));
    }
    
    try {
      // Additional file type checking for PDFs
      // For DOC/DOCX files, checking the magic numbers would be more complex
      // Here we're focusing on PDFs which are easier to validate
      if (req.file.mimetype === 'application/pdf') {
        const fileBuffer = fs.readFileSync(req.file.path);
        // Check PDF signature (magic numbers)
        if (!fileBuffer.toString('ascii', 0, 5).match(/%PDF-/)) {
          // Delete the invalid file
          fs.unlinkSync(req.file.path);
          return next(new ValidationError('Invalid PDF file. File content does not match PDF format.'));
        }
      }
      
      // If file is valid, continue
      next();
    } catch (error) {
      // Delete the file if validation fails
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting invalid file:', unlinkError);
        }
      }
      
      return next(new FileError(`Error processing file: ${error.message}`));
    }
  }
]; 