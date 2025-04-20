# Database Migration Fixes

## Prompt 1: Fix Future-Dated Migrations and Missing User Model

Please update the following database migration files to use the current date instead of future dates (2025-04-18). The migrations are located in the `/migrations` directory.

1. First, rename file `20250420125199-create-enum-types.js` to use today's date with sequence number 000:
   - Format: `YYYYMMDD000000-create-enum-types.js`

2. Then, rename all other migration files in sequence to ensure proper dependency order:
   - Format: `YYYYMMDD000001-create-users-table.js`
   - Format: `YYYYMMDD000002-create-blog_categories-table.js`
   - Format: `YYYYMMDD000003-create-blog_tags-table.js` 
   - And so on following this specific sequence:
     - users
     - blog_categories
     - blog_tags
     - blog_posts
     - blog_posts_tags
     - profiles
     - skills
     - education
     - experience
     - projects
     - testimonials
     - contact_submissions
     - settings
     - media
     - notifications
     - email_verification_tokens
     - password_reset_tokens
     - refresh_tokens
     - api_keys
     - rate_limits
     - audit_logs
     - websocket_connections
     - websocket_messages

Also, create the missing User.js model file in src/shared/database/models/ directory based on the User table structure defined in the migrations. The model should:
- Define all fields matching the migration
- Use proper data types and validations
- Include associations with other models

## Prompt 2: Fix ID Type Inconsistencies and Foreign Key References

There are inconsistencies between primary key types in the database tables. Please make the following changes:

1. In `migrations/XXXXXX-create-blog_posts-table.js`:
   - Change the author_id field type from UUID to INTEGER to match the users table ID type
   - Update line: `type: Sequelize.UUID` to `type: Sequelize.INTEGER`
   - Remove `defaultValue: Sequelize.UUIDV4` for any field referencing users.id

2. Check and fix all migration files that reference the users table to ensure they use the correct ID type (INTEGER) rather than UUID.

3. For consistency, ensure all tables that should use INTEGER IDs have this configuration:
   ```javascript
   id: {
     type: Sequelize.INTEGER,
     primaryKey: true,
     autoIncrement: true,
   },
   ```

## Prompt 3: Fix defaultValue in audit_logs Migration

There's a specific issue in the audit_logs migration:

1. Open `migrations/XXXXXX-create-audit_logs-table.js`
2. Locate the created_at field that has incorrect defaultValue: {}
3. Replace with:
   ```javascript
   created_at: {
     type: Sequelize.DATE,
     defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
   },
   ```

## Prompt 4: Create Sequentially-Ordered Migration Script

Create a new file called `migrate-sequential.js` in the project root with the following content:

```javascript
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');
const execPromise = util.promisify(exec);

/**
 * Script to run migrations in the correct order
 * Ensures tables with dependencies are created after the tables they depend on
 */

// Define the sequence of migrations to execute in correct order
const migrationSequence = [
  'create-enum-types',
  'create-users-table',
  'create-blog_categories-table',
  'create-blog_tags-table',
  'create-blog_posts-table',
  'create-blog_posts_tags-table',
  'create-profiles-table',
  'create-skills-table',
  'create-education-table',
  'create-experience-table',
  'create-projects-table',
  'create-testimonials-table',
  'create-contact_submissions-table',
  'create-settings-table',
  'create-media-table',
  'create-notifications-table',
  'create-email_verification_tokens-table',
  'create-password_reset_tokens-table',
  'create-refresh_tokens-table',
  'create-api_keys-table',
  'create-rate_limits-table',
  'create-audit_logs-table',
  'create-websocket_connections-table',
  'create-websocket_messages-table'
];

async function runMigrations() {
  // Get all migration files
  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir);
  
  // Create a map of migration names to file names
  const migrationMap = {};
  migrationFiles.forEach(file => {
    const migrationName = file.split('-').slice(1).join('-').replace('.js', '');
    migrationMap[migrationName] = file;
  });
  
  console.log('Running migrations in sequence...');
  
  // Run migrations in the defined sequence
  for (const migrationName of migrationSequence) {
    const fileName = migrationMap[migrationName];
    if (!fileName) {
      console.error(`Migration file for ${migrationName} not found. Skipping.`);
      continue;
    }
    
    try {
      console.log(`Running migration: ${fileName}`);
      await execPromise(`npx sequelize-cli db:migrate --to ${fileName}`);
      console.log(`Successfully ran migration: ${fileName}`);
    } catch (error) {
      console.error(`Error running migration ${fileName}:`, error.message);
      process.exit(1);
    }
  }
  
  console.log('All migrations completed successfully!');
  
  // Run seeders
  console.log('Running seeders...');
  try {
    await execPromise('npx sequelize-cli db:seed:all');
    console.log('Successfully ran all seeders!');
  } catch (error) {
    console.error('Error running seeders:', error.message);
  }
}

runMigrations();
```

Update the package.json scripts section to include:
```json
"migrate:sequential": "node migrate-sequential.js"
```

After implementing these changes, the database migrations should run correctly without dependency issues or data type inconsistencies. This will allow the application to function properly when connecting to the database.
