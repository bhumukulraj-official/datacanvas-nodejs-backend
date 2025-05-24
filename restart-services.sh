#!/bin/bash

# Print status messages with color
echo -e "\033[1;34mStopping existing Docker containers...\033[0m"
docker-compose down -v

# Start required services
echo -e "\033[1;34mStarting postgres, redis, minio, smtp and api containers...\033[0m"
docker-compose up -d --build postgres redis minio smtp api

# Wait for services to be ready
echo -e "\033[1;34mWaiting for services to be ready...\033[0m"
sleep 15  # Increased sleep for SMTP to initialize

# Run database migrations
echo -e "\033[1;34mRunning database migrations...\033[0m"
npx sequelize-cli db:migrate

# Run database seeds
echo -e "\033[1;34mRunning database seeds...\033[0m"
npx sequelize-cli db:seed:all

# Verify email service connection
echo -e "\033[1;34mVerifying email service connection...\033[0m"
node -e "require('./src/config/email').verifyConnection().then(() => console.log('\033[1;32mEmail service connected successfully!\033[0m')).catch(err => { console.error('\033[1;31mEmail connection failed:\033[0m', err); process.exit(1); })"

echo -e "\033[1;32mAll services restarted and ready!\033[0m"
echo -e "\033[1;33mMailDev interface available at: http://localhost:1080\033[0m" 