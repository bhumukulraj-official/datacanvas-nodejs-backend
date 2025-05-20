const fs = require('fs');
const path = require('path');
const sequelize = require('../../config/database');

const models = {};
const modelsPath = path.join(__dirname);

// Load all models
fs.readdirSync(modelsPath)
  .filter(file => file !== 'index.js' && file.endsWith('.js'))
  .forEach(file => {
    const model = require(path.join(modelsPath, file));
    models[model.name] = model;
  });

// Set up associations
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = {
  ...models,
  sequelize
}; 