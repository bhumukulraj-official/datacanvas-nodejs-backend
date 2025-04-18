# Portfolio Website Backend

A robust backend API for a personal portfolio website with admin management.

## Features

- User authentication with JWT
- Profile management
- Project showcase
- Blog functionality
- Media management
- Contact form handling
- WebSocket notifications
- Admin dashboard
- SEO optimization

## Tech Stack

- Node.js & Express
- PostgreSQL & Sequelize ORM
- Redis for caching and WebSocket
- JWT for authentication
- AWS S3 for file storage (optional)

## Prerequisites

- Node.js (v16+)
- PostgreSQL (v12+)
- Redis (optional, for caching and WebSocket)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/portfolio-backend.git
   cd portfolio-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration.

4. Create the database:
   ```
   createdb portfolio_dev
   ```

5. Run migrations:
   ```
   npm run migrate
   ```

6. Seed the database with initial data:
   ```
   npm run seed
   ```

## Database Setup

The application uses Sequelize ORM to handle database operations. The models are defined in `src/modules/*/models/` directories.

### Database Configuration

Configure your database connection in `.env`:

```
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=portfolio_dev
DB_HOST=localhost
DB_PORT=5432
```

### Running Migrations

```
# Run all migrations
npm run migrate

# Undo the most recent migration
npm run migrate:undo

# Undo all migrations
npm run migrate:undo:all
```

### Generating Migrations

If you update any models, you can automatically generate migration files:

```
npm run generate:migrations
```

### Database Seeding

To seed the database with initial data:

```
npm run seed
```

This will create an admin user with the following credentials:
- Email: admin@example.com
- Password: Admin123!

## Running the Application

### Development:

```
npm run dev
```

### Production:

```
npm start
```

## API Documentation

API documentation is available at `/api/docs` when the server is running.

## Testing

Run tests with:

```
npm test
```

## License

MIT 