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