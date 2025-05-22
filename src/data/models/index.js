const fs = require('fs');
const path = require('path');
const sequelize = require('../../config/database');

const models = {};

// Helper function to recursively load models from subdirectories
function loadModelsFromDir(dir) {
  fs.readdirSync(dir).forEach(item => {
    const itemPath = path.join(dir, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      // Recursively load models from subdirectory
      loadModelsFromDir(itemPath);
    } else if (item !== 'index.js' && item !== 'BaseModel.js' && item.endsWith('.js')) {
      try {
        // Load model file
        const ModelClass = require(itemPath);
        
        // Check if it's a valid model class
        if (ModelClass && typeof ModelClass === 'function' && ModelClass.prototype) {
          // Initialize the model
          if (typeof ModelClass.init === 'function') {
            ModelClass.init();
          }
          
          // Use the class name as the model name
          const modelName = ModelClass.name;
          if (modelName) {
            models[modelName] = ModelClass;
          }
        }
      } catch (error) {
        console.error(`Error loading model from ${itemPath}:`, error);
      }
    }
  });
}

// Load all models from the models directory and its subdirectories
loadModelsFromDir(__dirname);

// Set up associations
Object.values(models).forEach(model => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

module.exports = {
  ...models,
  sequelize
}; 