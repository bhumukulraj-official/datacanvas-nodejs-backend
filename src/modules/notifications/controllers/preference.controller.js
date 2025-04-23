const preferenceService = require('../services/preference.service');
const { ApiError } = require('../../../shared/utils/ApiError');

/**
 * Get notification preferences for authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const preferences = await preferenceService.getUserPreferences(userId);
    
    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update notification preferences for authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;
    
    const updatedPreferences = await preferenceService.updateUserPreferences(userId, preferences);
    
    res.json({
      success: true,
      data: updatedPreferences,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset notification preferences to defaults for authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.resetPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const defaultPreferences = await preferenceService.resetUserPreferences(userId);
    
    res.json({
      success: true,
      data: defaultPreferences,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update notification preferences for a specific category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateCategoryPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { category } = req.params;
    const categorySettings = req.body;
    
    // Get current preferences
    const currentPreferences = await preferenceService.getUserPreferences(userId);
    
    // Check if category exists
    if (!currentPreferences.categories[category]) {
      throw new ApiError(`Category ${category} not found`, 404, 'CAT_001');
    }
    
    // Create updated preferences
    const updatedPreferences = {
      ...currentPreferences,
      categories: {
        ...currentPreferences.categories,
        [category]: {
          ...currentPreferences.categories[category],
          ...categorySettings,
        },
      },
    };
    
    // Update preferences
    const result = await preferenceService.updateUserPreferences(userId, updatedPreferences);
    
    res.json({
      success: true,
      data: {
        category,
        settings: result.categories[category],
      },
    });
  } catch (error) {
    next(error);
  }
}; 