const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * This script ensures migrations run in the correct order based on dependencies.
 * It handles the issue where foreign key constraints require tables to exist before being referenced.
 */

console.log('Running migrations in the correct order...');

// First migration - enum types
const runEnumTypes = () => {
  return new Promise((resolve, reject) => {
    const command = 'npx sequelize-cli db:migrate --to 20250420125199-create-enum-types.js';
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running enum types migration: ${error.message}`);
        return reject(error);
      }
      console.log(stdout);
      resolve();
    });
  });
};

// Second - Create users table (required by other tables)
const runUsersTable = () => {
  return new Promise((resolve, reject) => {
    const command = 'npx sequelize-cli db:migrate --to 20250420125200-create-users-table.js';
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running users table migration: ${error.message}`);
        return reject(error);
      }
      console.log(stdout);
      resolve();
    });
  });
};

// Run remaining migrations
const runRemainingMigrations = () => {
  return new Promise((resolve, reject) => {
    const command = 'npx sequelize-cli db:migrate';
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running remaining migrations: ${error.message}`);
        return reject(error);
      }
      console.log(stdout);
      resolve();
    });
  });
};

// Seed the database
const seedDatabase = () => {
  return new Promise((resolve, reject) => {
    const command = 'npx sequelize-cli db:seed:all';
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error seeding database: ${error.message}`);
        return reject(error);
      }
      console.log(stdout);
      resolve();
    });
  });
};

// Run migrations in sequence
const runAll = async () => {
  try {
    await runEnumTypes();
    await runUsersTable();
    await runRemainingMigrations();
    await seedDatabase();
    console.log('All migrations and seeding completed successfully!');
  } catch (error) {
    console.error('Migration process failed', error);
    process.exit(1);
  }
};

runAll(); 