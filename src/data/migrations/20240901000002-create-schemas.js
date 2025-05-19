'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Wrap in transaction for safety
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Create schemas
        CREATE SCHEMA IF NOT EXISTS auth;
        CREATE SCHEMA IF NOT EXISTS content;
        CREATE SCHEMA IF NOT EXISTS messaging;
        CREATE SCHEMA IF NOT EXISTS billing;
        CREATE SCHEMA IF NOT EXISTS public_api;
        CREATE SCHEMA IF NOT EXISTS metrics;
        
        -- Grant privileges
        GRANT ALL ON SCHEMA auth TO postgres;
        GRANT ALL ON SCHEMA content TO postgres;
        GRANT ALL ON SCHEMA messaging TO postgres;
        GRANT ALL ON SCHEMA billing TO postgres;
        GRANT ALL ON SCHEMA public_api TO postgres;
        GRANT ALL ON SCHEMA metrics TO postgres;
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Wrap in transaction for safety
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP SCHEMA IF EXISTS metrics CASCADE;
        DROP SCHEMA IF EXISTS public_api CASCADE;
        DROP SCHEMA IF EXISTS billing CASCADE;
        DROP SCHEMA IF EXISTS messaging CASCADE;
        DROP SCHEMA IF EXISTS content CASCADE;
        DROP SCHEMA IF EXISTS auth CASCADE;
      `, { transaction: t });
    });
  }
}; 