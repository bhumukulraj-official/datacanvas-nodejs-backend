
I'll check the migration files to identify the issues with database migrations:

Read file: migrations/20250420125200-create-users-table.js

Read file: migrations/20250420125200-create-audit_logs-table.js
Let me check another migration to understand the dependency structure:

Read file: migrations/20250420125200-create-blog_posts-table.js
Let me also check the database configuration:

Read file: src/shared/config/database.js

Read file: .sequelizerc
Based on my analysis of the migration files and attempted migrations, I've identified several critical issues with the database setup:

## 1. Timestamp Issues

All migration files (except the enum types) have the same timestamp prefix `20250420125200`, causing problems:

- Sequelize uses timestamps to determine migration order
- With identical timestamps, execution order is unpredictable
- This breaks dependencies between tables (e.g., foreign keys)

## 2. Foreign Key Dependencies

Many tables have foreign key references to other tables that might not exist yet:

- `audit_logs` references `users`
- `blog_posts` references both `blog_categories` and `users`
- Most tables have user-related foreign keys

When migrations run in the wrong order, they fail with errors like:
```
ERROR: relation "users" does not exist
```

## 3. ID Column Type Mismatch

There's a mismatch in ID column types between tables:

- `users` table uses INTEGER as primary key
- `blog_posts` and some other tables use UUID
- Yet `blog_posts` has a foreign key to `users.id` which is INTEGER

## 4. Future-Dated Timestamps

All migrations use future dates (2025), which:
- Is unconventional (migrations should use current dates)
- Could cause issues with migration ordering in the future

## 5. Database Schema Configuration

The database setup doesn't properly handle the full transaction of creating tables with dependencies.

## Recommended Fixes

1. **Rename migration files with sequential timestamps**:
   - Use current date (YYYYMMDDHHMMSS) instead of future dates
   - Ensure proper sequencing for dependencies:
     ```
     20230501000000-create-enum-types.js
     20230501000001-create-users-table.js
     20230501000002-create-blog-categories.js
     ...and so on
     ```

2. **Fix column type inconsistencies**:
   - Ensure all ID columns use consistent types (either all UUID or all INTEGER)
   - Update foreign key references to match primary key types

3. **Update the migration process**:
   - Create a specialized migration runner that handles dependencies correctly
   - Implement proper transaction handling for dependent tables

4. **Fix specific migration files**:
   - Correct the `defaultValue` issue in `audit_logs` table where `created_at` has `defaultValue: {}`
   - Ensure all tables with foreign keys have proper `allowNull` settings

These issues need to be addressed before the database migrations can run successfully. Would you like me to assist in implementing any of these fixes?
