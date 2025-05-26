require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      schema: 'public'
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      useUTC: false,
      dateStrings: true,
      typeCast: true,
      schema: process.env.DB_SCHEMA || 'public'
    },
    migrationStorageTableSchema: 'public',
    seederStorageTableSchema: 'public'
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      schema: 'public'
    },
    pool: {
      max: 2,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      useUTC: false,
      dateStrings: true,
      typeCast: true,
      schema: process.env.DB_SCHEMA || 'public'
    },
    migrationStorageTableSchema: 'public',
    seederStorageTableSchema: 'public'
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      schema: 'public'
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      useUTC: false,
      dateStrings: true,
      typeCast: true,
      schema: process.env.DB_SCHEMA || 'public'
    },
    migrationStorageTableSchema: 'public',
    seederStorageTableSchema: 'public'
  }
}; 