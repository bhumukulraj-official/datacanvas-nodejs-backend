const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { FileError } = require('../../../shared/errors');

// Define storage locations
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const AVATAR_DIR = path.join(UPLOAD_DIR, 'avatars');
const RESUME_DIR = path.join(UPLOAD_DIR, 'resumes');

// Create directories if they don't exist
[UPLOAD_DIR, AVATAR_DIR, RESUME_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine destination based on file type
    let uploadPath = UPLOAD_DIR;
    
    if (file.fieldname === 'avatar') {
      uploadPath = AVATAR_DIR;
    } else if (file.fieldname === 'resume') {
      uploadPath = RESUME_DIR;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

// File filter for avatars
const avatarFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new FileError('Invalid file type. Only JPG, PNG, and WebP are allowed.', 'FILE_002'), false);
  }
  
  // Check file size (limit to 5MB, but actual limit is set in multer options)
  cb(null, true);
};

// File filter for resumes
const resumeFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new FileError('Invalid file type. Only PDF, DOC, and DOCX are allowed.', 'FILE_002'), false);
  }
  
  // Check file size (limit to 10MB, but actual limit is set in multer options)
  cb(null, true);
};

// Upload middleware for avatars
const uploadAvatar = multer({
  storage,
  fileFilter: avatarFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
}).single('avatar');

// Upload middleware for resumes
const uploadResume = multer({
  storage,
  fileFilter: resumeFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
}).single('resume');

// Wrapper to handle multer errors
const handleAvatarUpload = (req, res, next) => {
  uploadAvatar(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new FileError('File too large. Maximum size is 5MB.', 'FILE_001'));
      }
      return next(new FileError('File upload failed.', 'FILE_003'));
    } else if (err) {
      return next(err);
    }
    
    // If no file was uploaded
    if (!req.file) {
      return next(new FileError('No file uploaded.', 'FILE_004'));
    }
    
    next();
  });
};

// Wrapper to handle multer errors for resume
const handleResumeUpload = (req, res, next) => {
  uploadResume(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new FileError('File too large. Maximum size is 10MB.', 'FILE_001'));
      }
      return next(new FileError('File upload failed.', 'FILE_003'));
    } else if (err) {
      return next(err);
    }
    
    // If no file was uploaded
    if (!req.file) {
      return next(new FileError('No file uploaded.', 'FILE_004'));
    }
    
    next();
  });
};

module.exports = {
  handleAvatarUpload,
  handleResumeUpload
}; 