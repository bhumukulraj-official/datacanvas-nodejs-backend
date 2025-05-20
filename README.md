# Portfolio Backend

A professional backend service for portfolio management with project tracking, client management, invoicing, and analytics.

## Overview

This backend system provides a complete API for portfolio management with the following features:

- User authentication and role-based access control
- Portfolio and project management
- Client project assignments
- Messaging system
- Invoicing and payment tracking
- Analytics and reporting

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM

## Prerequisites

- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd portfolio-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure the environment variables in `.env`:
   ```
   NODE_ENV=development
   PORT=3000
   
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=portfolio_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   
   # JWT
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRY=24h
   REFRESH_TOKEN_EXPIRY=7d
   ```

5. Create the database:
   ```bash
   createdb portfolio_db
   ```

## Database Management

### Run Migrations

Apply all migrations to create the database schema:

```bash
npx sequelize-cli db:migrate
```

Undo the last migration:

```bash
npx sequelize-cli db:migrate:undo
```

Undo all migrations:

```bash
npx sequelize-cli db:migrate:undo:all
```

### Run Seeders

Populate the database with sample data:

```bash
npx sequelize-cli db:seed:all
```

Undo the last seeder:

```bash
npx sequelize-cli db:seed:undo
```

Undo all seeders:

```bash
npx sequelize-cli db:seed:undo:all
```

### Create New Migration

```bash
npx sequelize-cli migration:generate --name migration_name
```

### Create New Seeder

```bash
npx sequelize-cli seed:generate --name seeder_name
```
### Seed sample data:

```bash
npx sequelize-cli db:seed --seed 20240901000007-seed-portfolio-views.js
```
## Running the Application

### Development Mode

Start the server with hot-reloading:

```bash
npm run dev
```

### Production Mode

Build and start the production server:

```bash
npm run build
npm start
```

## API Documentation

API documentation is available at `/api-docs` when the server is running.

### Main API Endpoints

- **Auth**: `/api/auth/*`
- **Projects**: `/api/projects/*`
- **Users & Profiles**: `/api/users/*`
- **Clients**: `/api/clients/*`
- **Messages**: `/api/messages/*`
- **Invoices**: `/api/invoices/*`
- **Payments**: `/api/payments/*`
- **Metrics**: `/api/metrics/*`

## Testing

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Database Schema

The database is organized into the following schemas:

- **auth**: User authentication and authorization
- **content**: Profiles, projects, and portfolio content
- **messaging**: Internal messaging system
- **billing**: Invoicing and payments
- **public_api**: Public-facing views
- **metrics**: Analytics and reporting

## Useful Commands

### Check Server Status

```bash
curl http://localhost:3000/api/health
```

### Database Backup

Create a database backup:

```bash
pg_dump -U postgres -d portfolio_db > backup_$(date +%Y%m%d).sql
```

Restore from backup:

```bash
psql -U postgres -d portfolio_db < backup_file.sql
```

### Docker Support

Build Docker image:

```bash
docker build -t portfolio-backend .
```

Run Docker container:

```bash
docker run -p 3000:3000 --env-file .env portfolio-backend
```

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running:
   ```bash
   sudo service postgresql status
   ```

2. Check database connection parameters in `.env`

3. Test database connection:
   ```bash
   psql -U postgres -d portfolio_db
   ```

### Migration/Seeder Issues

If you encounter issues with specific migrations or seeders:

1. Run migrations with verbose logging:
   ```bash
   npx sequelize-cli db:migrate --debug
   ```

2. Reset the database (development only):
   ```bash
   npx sequelize-cli db:drop
   npx sequelize-cli db:create
   npx sequelize-cli db:migrate
   npx sequelize-cli db:seed:all
   ```

## License

[MIT License](LICENSE)

# Portfolio Backend - Database Seed Files

This repository contains the database structure and seed files for a portfolio management system. The database is designed for PostgreSQL and includes schemas for authentication, content management, billing, messaging, and metrics.

## Database Structure

The database consists of the following schemas:

- **auth**: User authentication and authorization
- **content**: Portfolio content, projects, and skills
- **billing**: Invoices and payment processing
- **messaging**: Communication between users
- **metrics**: System and user analytics

## Seed Files

The seed files are organized by schema and contain sample data for testing and development:

- `00-schema-seeds.sql`: Main file that creates schemas and runs all seed files
- `01-auth-seeds.sql`: Sample users, roles, and authentication tokens
- `02-content-seeds.sql`: Sample projects, profiles, and skills
- `03-billing-seeds.sql`: Sample invoices and payments
- `04-messaging-seeds.sql`: Sample messages and attachments
- `05-metrics-seeds.sql`: Sample analytics data

## How to Use

### Prerequisites

- PostgreSQL 12 or higher
- psql command-line tool

### Setup and Seeding

1. Create a new PostgreSQL database:
   ```
   createdb portfolio_db
   ```

2. Run the schema creation script:
   ```
   psql -d portfolio_db -f portfolio_db.sql
   ```

3. Run the seed files:
   ```
   psql -d portfolio_db -f seeds/00-schema-seeds.sql
   ```

Alternatively, you can run each seed file individually if you want more control:

```
psql -d portfolio_db -f seeds/01-auth-seeds.sql
psql -d portfolio_db -f seeds/02-content-seeds.sql
# etc.
```

## Sample Data

The seed files create:

- 5 users with different roles (admin, developer, client, etc.)
- 5 projects with different statuses
- Various invoices, payments, and messages between users
- Sample metrics and analytics data

The data is structured to demonstrate relationships between different entities in the system.

## Notes

- All passwords in the seed data are hashed but for development purposes only. In a production environment, ensure proper security measures are implemented.
- The sample data includes timestamps relative to the current time when the seeds are run.
- Foreign key relationships are maintained throughout the seed data. 