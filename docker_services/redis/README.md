# Redis Docker Service

This Docker Compose configuration sets up a Redis server for the DataCanvas application.

## Configuration

The Redis service is configured according to the application's `.env` file with the following settings:
- Host: localhost
- Port: 6379
- No password authentication
- Data persistence enabled (AOF)

## Usage

### Starting the service

```bash
cd docker_services/redis
docker-compose up -d
```

### Stopping the service

```bash
cd docker_services/redis
docker-compose down
```

### Checking service status

```bash
docker ps | grep datacanvas-redis
```

## Data Persistence

Redis data is persisted using a Docker volume (`redis_data`). This ensures your data remains intact even if the container is stopped or removed.

## Connecting to the Redis CLI

```bash
docker exec -it datacanvas-redis redis-cli
``` 