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