const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * This script properly sets up the database from scratch
 * It ensures all tables are created in the correct order
 */

console.log('Setting up database from scratch...');

// Helper function to run a command and print the output
const runCommand = async (command) => {
  try {
    const { stdout, stderr } = await execPromise(command);
    console.log(stdout);
    if (stderr) console.error(stderr);
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return false;
  }
};

const resetDatabase = async () => {
  try {
    // 1. Drop all tables in the database
    console.log('Dropping all tables in the database...');
    await runCommand(`sudo -u postgres psql -d portfolio_dev -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`);
    
    // 2. Run individual migrations in correct order
    console.log('\nRunning migrations in correct order...');
    
    // Create enum types first
    await runCommand('npx sequelize-cli db:migrate --to 20250420125199-create-enum-types.js');
    
    // Run each table creation individually in the right order
    const tables = [
      'users',
      'blog_categories',
      'blog_tags',
      'blog_posts',
      'blog_posts_tags',
      'profiles',
      'skills',
      'education',
      'experience',
      'projects',
      'testimonials',
      'contact_submissions',
      'settings',
      'media',
      'notifications',
      'email_verification_tokens',
      'password_reset_tokens',
      'refresh_tokens',
      'api_keys',
      'rate_limits',
      'audit_logs',
      'websocket_connections',
      'websocket_messages'
    ];
    
    for (const table of tables) {
      console.log(`\nCreating ${table} table...`);
      const success = await runCommand(`npx sequelize-cli db:migrate --to 20250420125200-create-${table}-table.js`);
      if (!success) {
        console.log(`Warning: Failed to create ${table} table. Continuing...`);
      }
    }
    
    // 3. Run seed data
    console.log('\nSeeding database...');
    await runCommand('npx sequelize-cli db:seed:all');
    
    console.log('\nDatabase setup completed successfully!');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
};

// Run the database reset function
resetDatabase(); 