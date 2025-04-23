/**
 * Skill Icon Validator Middleware
 * Validates that icon URLs point to valid image files
 */

/**
 * Middleware to validate that icon URLs point to valid image files
 */
const validateIconUrl = (req, res, next) => {
  if (req.body.icon) {
    const iconUrl = req.body.icon;
    const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
    const isValidExtension = validImageExtensions.some(ext => 
      iconUrl.split('?')[0].toLowerCase().endsWith(ext)
    );
    
    if (!isValidExtension) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_IMAGE_URL',
          message: 'Icon URL must point to a valid image file (jpg, jpeg, png, gif, svg, webp)'
        }
      });
    }
  }
  
  // If no icon or valid icon, proceed
  next();
};

module.exports = validateIconUrl; 