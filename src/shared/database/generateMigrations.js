/**
 * Utility script to generate migration files from Sequelize models
 * This can be run with: node src/shared/database/generateMigrations.js
 */

const fs = require('fs');
const path = require('path');
const { sequelize, Sequelize } = require('./index');
require('./associations')(); // Initialize associations

// Set up migrations directory
const migrationsDir = path.join(__dirname, '../../../migrations');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Get all model definitions
const models = sequelize.models;

// Generate a timestamp for the migration file
const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').substring(0, 14);

// Generate migration content for each model
Object.keys(models).forEach((modelName) => {
  const model = models[modelName];
  const tableName = model.tableName;
  const attributes = model.rawAttributes;
  
  // Skip through tables with no primary key (junction tables)
  const hasPrimaryKey = Object.values(attributes).some(attr => attr.primaryKey);
  if (!hasPrimaryKey && modelName !== 'BlogPostTag') {
    return;
  }
  
  // Generate migration file content
  let migrationContent = `'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('${tableName}', {
`;

  // Add attributes to migration
  Object.keys(attributes).forEach((attrName) => {
    const attribute = attributes[attrName];
    
    // Skip if internal Sequelize field
    if (attribute.field === '_virtual') {
      return;
    }
    
    // Generate attribute definition
    migrationContent += `      ${attrName}: {\n`;
    
    // Add type
    if (attribute.type instanceof Sequelize.ENUM) {
      const values = attribute.type.values;
      migrationContent += `        type: Sequelize.ENUM(${values.map(v => `'${v}'`).join(', ')}),\n`;
    } else if (attribute.type instanceof Sequelize.ARRAY) {
      const itemType = attribute.type.options.type;
      if (itemType instanceof Sequelize.DataTypes.STRING) {
        migrationContent += `        type: Sequelize.ARRAY(Sequelize.STRING),\n`;
      } else {
        migrationContent += `        type: Sequelize.ARRAY(Sequelize.INTEGER),\n`;
      }
    } else if (attribute.type instanceof Sequelize.DECIMAL) {
      const precision = attribute.type.options.precision || 10;
      const scale = attribute.type.options.scale || 2;
      migrationContent += `        type: Sequelize.DECIMAL(${precision}, ${scale}),\n`;
    } else if (attribute.type instanceof Sequelize.JSONB) {
      migrationContent += `        type: Sequelize.JSONB,\n`;
    } else {
      const type = attribute.type.constructor.name;
      if (type === 'Function') {
        // Handle special case for common types
        if (attribute.type.key === 'STRING') {
          const length = attribute.type.options?.length || 255;
          migrationContent += `        type: Sequelize.STRING(${length}),\n`;
        } else {
          migrationContent += `        type: Sequelize.${attribute.type.key},\n`;
        }
      } else {
        migrationContent += `        type: Sequelize.${type},\n`;
      }
    }
    
    // Add other attribute properties
    if (attribute.allowNull === false) {
      migrationContent += `        allowNull: false,\n`;
    }
    
    if (attribute.defaultValue !== undefined && attribute.defaultValue !== null) {
      if (typeof attribute.defaultValue === 'string') {
        migrationContent += `        defaultValue: '${attribute.defaultValue}',\n`;
      } else if (attribute.defaultValue === Sequelize.literal('CURRENT_TIMESTAMP')) {
        migrationContent += `        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),\n`;
      } else if (attribute.defaultValue instanceof Array) {
        migrationContent += `        defaultValue: [],\n`;
      } else if (typeof attribute.defaultValue === 'object') {
        migrationContent += `        defaultValue: {},\n`;
      } else {
        migrationContent += `        defaultValue: ${attribute.defaultValue},\n`;
      }
    }
    
    if (attribute.primaryKey) {
      migrationContent += `        primaryKey: true,\n`;
    }
    
    if (attribute.autoIncrement) {
      migrationContent += `        autoIncrement: true,\n`;
    }
    
    if (attribute.unique) {
      migrationContent += `        unique: true,\n`;
    }
    
    // References
    if (attribute.references) {
      migrationContent += `        references: {\n`;
      migrationContent += `          model: '${attribute.references.model}',\n`;
      migrationContent += `          key: '${attribute.references.key}',\n`;
      migrationContent += `        },\n`;
      
      if (attribute.onDelete) {
        migrationContent += `        onDelete: '${attribute.onDelete}',\n`;
      }
      
      if (attribute.onUpdate) {
        migrationContent += `        onUpdate: '${attribute.onUpdate}',\n`;
      }
    }
    
    migrationContent += `      },\n`;
  });

  // Close the table definition
  migrationContent += `    });

    // Add indexes
`;

  // Add indexes if defined in the model
  if (model.options.indexes) {
    model.options.indexes.forEach((index) => {
      const fields = JSON.stringify(index.fields);
      const unique = index.unique ? ', unique: true' : '';
      migrationContent += `    await queryInterface.addIndex('${tableName}', ${fields}, { name: '${index.name}'${unique} });\n`;
    });
  }

  // Complete migration
  migrationContent += `  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('${tableName}');
  }
};
`;

  // Write the migration file
  const fileName = `${timestamp}-create-${tableName}-table.js`;
  const filePath = path.join(migrationsDir, fileName);
  fs.writeFileSync(filePath, migrationContent);
  
  console.log(`Created migration: ${fileName}`);
});

// Generate ENUM type migration if needed
const enumTypeMigration = `'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(\`
      CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high');
    \`);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(\`
      DROP TYPE IF EXISTS notification_priority;
    \`);
  }
};
`;

const enumFileName = `${timestamp - 1}-create-enum-types.js`;
const enumFilePath = path.join(migrationsDir, enumFileName);
fs.writeFileSync(enumFilePath, enumTypeMigration);
console.log(`Created enum migration: ${enumFileName}`);

console.log('Migration generation completed.');
process.exit(0); 