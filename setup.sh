#!/bin/bash
set -e

echo "==== DatacanvadeV Project Setup ===="
echo "Installing and configuring required services..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if script is run with sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run this script with sudo privileges${NC}"
  exit 1
fi

# Update package lists
echo -e "${BLUE}[1/7] Updating package lists...${NC}"
pacman -Syu --noconfirm

# Install required utilities
echo -e "${BLUE}Installing required utilities...${NC}"
pacman -S --noconfirm bc

# Install Node.js (v16 or higher)
echo -e "${BLUE}[2/7] Installing Node.js...${NC}"
pacman -S --noconfirm nodejs npm

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
if [[ $(echo "$NODE_VERSION >= 16.0.0" | bc -l) -eq 1 ]]; then
  echo -e "${GREEN}Node.js v$NODE_VERSION installed successfully${NC}"
else
  echo -e "${YELLOW}Warning: Node.js version is lower than 16.0.0. Consider upgrading.${NC}"
fi

# Install PostgreSQL
echo -e "${BLUE}[3/7] Installing PostgreSQL...${NC}"
pacman -S --noconfirm postgresql

# Initialize PostgreSQL database
echo -e "${BLUE}[4/7] Initializing PostgreSQL database...${NC}"
# Check if database is already initialized
if [ ! -d "/var/lib/postgres/data" ] || [ -z "$(ls -A /var/lib/postgres/data)" ]; then
  # Switch to postgres user and initialize database
  sudo -u postgres bash -c "initdb --locale en_US.UTF-8 -D '/var/lib/postgres/data'"
else
  echo -e "${YELLOW}PostgreSQL data directory already exists. Skipping initialization.${NC}"
fi

# Start and enable PostgreSQL service
systemctl enable postgresql
systemctl start postgresql

# Create database and user
echo -e "${BLUE}Creating PostgreSQL user and databases...${NC}"
# Create the postgres user if doesn't exist (will throw error if exists, which we ignore)
sudo -u postgres bash -c "psql -c \"CREATE USER postgres WITH PASSWORD 'postgres' SUPERUSER;\"" || true

# Create databases if they don't exist
sudo -u postgres bash -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname = 'portfolio_dev'\" | grep -q 1 || psql -c \"CREATE DATABASE portfolio_dev OWNER postgres;\""
sudo -u postgres bash -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname = 'portfolio_test'\" | grep -q 1 || psql -c \"CREATE DATABASE portfolio_test OWNER postgres;\""

# Install Redis
echo -e "${BLUE}[5/7] Installing Redis...${NC}"
pacman -S --noconfirm redis

# Start and enable Redis service
systemctl enable redis
systemctl start redis

# Install project dependencies
echo -e "${BLUE}[6/7] Installing project dependencies...${NC}"
cd $(dirname "$0")
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo -e "${BLUE}Creating .env file from example...${NC}"
  cp .env.example .env
  # Replace placeholder passwords with real ones
  sed -i 's/<your-secure-database-password>/postgres/g' .env
  sed -i 's/<your-redis-password>//g' .env
  sed -i 's/<your-secure-jwt-secret-key>/temp-jwt-secret-please-change-in-production/g' .env
fi

# Run database migrations and seed data
echo -e "${BLUE}[7/7] Running database migrations and seeding data...${NC}"
node fix-database.js

echo -e "${GREEN}==== Setup completed successfully! ====${NC}"
echo -e "To start the application in development mode, run: ${YELLOW}npm run dev${NC}"
echo -e "To start the application in production mode, run: ${YELLOW}npm start${NC}"
echo -e "${RED}Note: For production use, please update the JWT secret and database passwords in your .env file!${NC}" 