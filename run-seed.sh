#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Array of seeders to run in order
SEEDERS=(
  "20250422022605000000001-seed-users.js"
  "20250422022605000000002-seed-blog_categories.js"
  "20250422022605000000003-seed-blog_tags.js"
  "20250422022605000000004-seed-blog_posts.js"
  "20250422022605000000005-seed-blog_posts_tags.js"
  "20250422022605000000006-seed-profiles.js"
  "20250422022605000000007-seed-skills.js"
  "20250422022605000000008-seed-education.js"
  "20250422022605000000009-seed-experience.js"
  "20250422022605000000010-seed-projects.js"
  "20250422022605000000011-seed-testimonials.js"
  "20250422022605000000012-seed-contact_submissions.js"
  "20250422022605000000013-seed-settings.js"
  "20250422022605000000014-seed-media.js"
  "20250422022605000000015-seed-notifications.js"
  "20250422022605000000016-seed-email_verification_tokens.js"
  "20250422022605000000017-seed-password_reset_tokens.js"
  "20250422022605000000018-seed-refresh_tokens.js"
  "20250422022605000000019-seed-api_keys.js"
  "20250422022605000000020-seed-rate_limits.js"
  "20250422022605000000021-seed-audit_logs.js"
  "20250422022605000000022-seed-websocket_connections.js"
  "20250422022605000000023-seed-websocket_messages.js"
)

TOTAL_SEEDERS=${#SEEDERS[@]}
SUCCESS_COUNT=0
FAILED_SEEDERS=()

echo -e "${BLUE}====================================================${NC}"
echo -e "${YELLOW}DATABASE MIGRATION AND SEEDING PROCESS${NC}"
echo -e "${BLUE}====================================================${NC}"

# Step 1: Undo all migrations
echo -e "\n${YELLOW}STEP 1: Undoing all migrations...${NC}"
npx sequelize-cli db:migrate:undo:all
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to undo migrations. Exiting.${NC}"
  exit 1
fi
echo -e "${GREEN}All migrations successfully undone!${NC}"

# Step 2: Re-run all migrations
echo -e "\n${YELLOW}STEP 2: Re-running all migrations...${NC}"
npx sequelize-cli db:migrate
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to re-run migrations. Exiting.${NC}"
  exit 1
fi
echo -e "${GREEN}All migrations successfully applied!${NC}"

# Step 3: Undo any existing seeds to ensure clean state
echo -e "\n${YELLOW}STEP 3: Undoing all previous seeds...${NC}"
npx sequelize-cli db:seed:undo:all
if [ $? -ne 0 ]; then
  echo -e "${RED}Warning: Failed to undo seeds. This might be fine if no seeds exist yet.${NC}"
  # We continue despite failure here, as there might not be any seeds to undo
fi

# Step 4: Run all seeders in sequence
echo -e "\n${YELLOW}STEP 4: Running all seeders...${NC}"
echo -e "${YELLOW}Total seeders to run: ${TOTAL_SEEDERS}${NC}"
echo -e "${BLUE}----------------------------------------------------${NC}"

for ((i=0; i<${#SEEDERS[@]}; i++)); do
  SEEDER=${SEEDERS[$i]}
  echo -e "\n[${i+1}/${TOTAL_SEEDERS}] ${YELLOW}Running seeder:${NC} ${SEEDER}"
  
  # Run the seeder
  npx sequelize-cli db:seed --seed ${SEEDER}
  
  # Check if the seeding was successful
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Success:${NC} ${SEEDER}"
    ((SUCCESS_COUNT++))
  else
    echo -e "${RED}✗ Failed:${NC} ${SEEDER}"
    FAILED_SEEDERS+=("${SEEDER}")
  fi
done

echo -e "\n${BLUE}====================================================${NC}"
echo -e "${YELLOW}PROCESS COMPLETED!${NC}"
echo -e "${GREEN}Successfully seeded:${NC} ${SUCCESS_COUNT}/${TOTAL_SEEDERS}"

# If any seeders failed, list them
if [ ${#FAILED_SEEDERS[@]} -gt 0 ]; then
  echo -e "${RED}Failed seeders (${#FAILED_SEEDERS[@]}):${NC}"
  for FAILED in "${FAILED_SEEDERS[@]}"; do
    echo -e "  - ${FAILED}"
  done
  
  echo -e "\n${YELLOW}Some seeders failed. You might need to fix the issues and run them manually:${NC}"
  echo -e "  npx sequelize-cli db:seed --seed [seeder-name]"
  
  exit 1
else
  echo -e "${GREEN}All seeders completed successfully!${NC}"
  exit 0
fi 