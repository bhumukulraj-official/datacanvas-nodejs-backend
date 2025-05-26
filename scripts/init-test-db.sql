-- Create test database if it doesn't exist
CREATE DATABASE portfolio_test;

-- Connect to the test database
\c portfolio_test;

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS public;
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

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 