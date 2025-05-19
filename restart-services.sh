#!/bin/bash

# Print status messages with color
echo -e "\033[1;34mStopping existing Docker containers...\033[0m"
docker-compose down -v

# Start required services
echo -e "\033[1;34mStarting postgres, redis, and minio containers...\033[0m"
docker-compose up -d --build postgres

# Wait for services to be ready
echo -e "\033[1;34mWaiting for services to be ready...\033[0m"
sleep 10

# Run database migrations
echo -e "\033[1;34mRunning database migrations...\033[0m"
npx sequelize-cli db:migrate

# Run database seeds
echo -e "\033[1;34mRunning database seeds...\033[0m"
echo "npx sequelize-cli db:seed:all"

echo -e "\033[1;32mAll services have been restarted and database is ready!\033[0m" 