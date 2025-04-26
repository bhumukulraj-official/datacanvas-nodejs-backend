# DataCanvas NodeJS Backend Architecture

## Overview
This project follows a monolithic architecture pattern but is organized into well-defined modules for better code organization and separation of concerns. The application is built using Node.js with Express as the web framework.

## Core Structure
- `src/` - Contains all source code
- `src/app.js` - Main application setup (Express configuration, middleware, etc.)
- `src/server.js` - Server initialization and startup
- `src/api/` - API routes and versioning
- `src/modules/` - Feature-based modules
- `src/shared/` - Shared utilities, middleware, and database configuration
- `src/utils/` - General utility functions

## Modules
The application is divided into the following modules, each representing a specific functional area:

1. **Auth Module** (`src/modules/auth/`)
   - Handles user authentication, registration, login, and token management
   - Contains controllers, services, middleware for authentication

2. **Profile Module** (`src/modules/profile/`)
   - Manages user profiles and related information

3. **Projects Module** (`src/modules/projects/`)
   - Handles project creation, management, and operations

4. **Blog Module** (`src/modules/blog/`)
   - Manages blog posts, categories, and related functionality

5. **Contact Module** (`src/modules/contact/`)
   - Manages contact information and inquiries

6. **Email Module** (`src/modules/email/`)
   - Handles email sending and templates

7. **Notifications Module** (`src/modules/notifications/`)
   - Manages user notifications

8. **WebSocket Module** (`src/modules/websocket/`)
   - Handles real-time communications

9. **Security Module** (`src/modules/security/`)
   - Manages security features and protections

10. **Search Module** (`src/modules/search/`)
    - Provides search functionality across the application

11. **Experience Module** (`src/modules/experience/`)
    - Manages user experience information

12. **Skills Module** (`src/modules/skills/`)
    - Handles user skills and competencies

13. **Scheduler Module** (`src/modules/scheduler/`)
    - Manages scheduled tasks and jobs

14. **System Module** (`src/modules/system/`)
    - Handles system-level operations and monitoring

15. **Media Module** (`src/modules/media/`)
    - Manages media files and assets

16. **Settings Module** (`src/modules/settings/`)
    - Handles application and user settings

17. **Education Module** (`src/modules/education/`)
    - Manages educational information

18. **Testimonials Module** (`src/modules/testimonials/`)
    - Handles user testimonials and reviews

## Module Structure
Each module typically follows this structure:
- `controllers/` - Request handlers
- `services/` - Business logic
- `models/` - Data models (if module-specific)
- `routes/` - API routes
- `middleware/` - Module-specific middleware
- `validators/` - Input validation
- `index.js` - Module exports

## Database
The application uses Sequelize ORM for database operations, with models defined in `src/shared/database/models/`.

## API Structure
- API routes are versioned (e.g., `/api/v1/`)
- Routes are organized by modules and functionality

## Infrastructure
- Includes Docker service configurations for development and deployment
- Migration scripts for database schema changes
- Seeder scripts for populating test data

This architecture allows for better maintainability and future scalability, even within a monolithic structure. Each module can be developed and tested independently, making the codebase easier to understand and extend. 