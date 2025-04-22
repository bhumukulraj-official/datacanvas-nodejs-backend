# PostgreSQL Docker Service

This directory contains the Docker configuration for running PostgreSQL database for the DataCanvas application.

## Prerequisites

- Docker Engine (version 20.10.0 or higher)
- Docker Compose (version 2.0.0 or higher)

## Directory Structure

```
postgres/
├── conf/
│   └── postgresql.conf    # PostgreSQL configuration file
├── docker-compose.yml     # Docker compose configuration
└── README.md             # This file
```

## Configuration

### Default Settings

- **Port**: 5432 (default PostgreSQL port)
- **Database**: datacanvas
- **User**: postgres
- **Password**: password

### Environment Variables

You can customize the database settings by creating a `.env` file in this directory with the following variables:

```env
POSTGRES_USER=your_custom_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=your_database_name
```

## Usage

### Starting the Database

1. Navigate to this directory:
   ```bash
   cd docker_services/postgres
   ```

2. Start the PostgreSQL container:
   ```bash
   docker-compose up -d
   ```

### Stopping the Database

```bash
docker-compose down
```

To remove all data volumes when stopping:
```bash
docker-compose down -v
```

### Checking Status

Check if the container is running:
```bash
docker-compose ps
```

View logs:
```bash
docker-compose logs -f postgres
```

### Connecting to the Database

#### Using psql CLI:
```bash
docker-compose exec postgres psql -U postgres -d datacanvas
```

#### Using Database Client:
- Host: localhost
- Port: 5432
- Database: datacanvas
- Username: postgres (or your custom user)
- Password: password (or your custom password)

## Data Persistence

Database data is persisted in a Docker volume named `postgres_data`. This ensures your data survives container restarts.

## Configuration Files

- `postgresql.conf`: Contains optimized PostgreSQL settings for:
  - Memory allocation
  - Query planning
  - Connection handling
  - Logging
  - Autovacuum

## Troubleshooting

1. If the container fails to start, check the logs:
   ```bash
   docker-compose logs postgres
   ```

2. To reset everything and start fresh:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

3. To check container health:
   ```bash
   docker-compose ps
   ```

## Security Notes

- Change the default password in production
- Consider implementing SSL for production use
- Restrict the exposed ports in production environment
- Review and adjust PostgreSQL configuration based on your production needs 