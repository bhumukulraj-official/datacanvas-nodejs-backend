# Portfolio Backend API Documentation

This document provides an overview of all API endpoints implemented in the backend service.

## API Version Information
- **Current Version**: v1
- **Base URL**: `/api/v1`

## Authentication API
Base path: `/api/v1/auth`

### User Registration and Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/register` | Register a new user | Public |
| POST | `/login` | Login a user | Public |
| POST | `/refresh` | Refresh access token | Public |
| POST | `/logout` | Logout a user | Private |
| POST | `/logout-all` | Logout from all devices | Private |
| POST | `/change-password` | Change user password | Private |

### Email Verification
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/verify-email` | Verify user email | Public |
| POST | `/resend-verification` | Resend verification email | Public |

### Password Reset
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/reset-password/request` | Request password reset | Public |
| POST | `/reset-password/confirm` | Confirm password reset | Public |

### Session Management
Base path: `/api/v1/auth/sessions`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get all active sessions for current user | Private |
| GET | `/:sessionId` | Get detailed information about a specific session | Private |
| DELETE | `/:sessionId` | Revoke a specific session | Private |
| DELETE | `/` | Revoke all sessions except the current one | Private |

## Profile API
Base path: `/api/v1/profile`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get user profile | Public/Private |
| PUT | `/` | Update user profile | Private |
| GET | `/me` | Get current user profile | Private |
| PUT | `/me` | Update current user profile | Private |
| PUT | `/avatar` | Update profile avatar | Private |
| DELETE | `/avatar` | Remove profile avatar | Private |

## Projects API
Base path: `/api/v1/projects`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List all projects | Public |
| GET | `/:slug` | Get project details | Public |
| POST | `/` | Create a new project | Private |
| PUT | `/:id` | Update a project | Private |
| DELETE | `/:id` | Delete a project | Private |
| GET | `/categories` | Get project categories | Public |

## Blog API
Base path: `/api/v1/blog`

### Posts
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/posts` | List all blog posts | Public |
| GET | `/posts/search` | Search blog posts | Public |
| GET | `/posts/:slug` | Get a specific post by slug | Public |
| GET | `/posts/:slug/related` | Get related posts | Public |
| POST | `/posts` | Create a new post | Private |
| PUT | `/posts/:id` | Update a post | Private |
| DELETE | `/posts/:id` | Delete a post | Private |
| POST | `/posts/:id/schedule` | Schedule a post for publishing | Private |

### Comments
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/posts/:postId/comments` | Get all comments for a post | Public |
| POST | `/posts/:postId/comments` | Add a comment to a post | Public/Private |
| PUT | `/posts/:postId/comments/:commentId` | Update a comment | Private |
| DELETE | `/posts/:postId/comments/:commentId` | Delete a comment | Private |

### Categories
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/categories` | Get all blog categories | Public |
| GET | `/categories/:slug` | Get a specific category | Public |
| POST | `/categories` | Create a new category | Private |
| PUT | `/categories/:id` | Update a category | Private |
| DELETE | `/categories/:id` | Delete a category | Private |

### Tags
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/tags` | Get all blog tags | Public |
| GET | `/tags/:slug` | Get a specific tag | Public |
| POST | `/tags` | Create a new tag | Private |
| PUT | `/tags/:id` | Update a tag | Private |
| DELETE | `/tags/:id` | Delete a tag | Private |

### Feeds
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/feed.xml` | Get RSS feed | Public |
| GET | `/feed.atom` | Get Atom feed | Public |

## Contact API
Base path: `/api/v1/contact`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/` | Submit a contact form | Public |
| GET | `/messages` | List contact messages | Private |
| GET | `/messages/:id` | Get a specific message | Private |
| PUT | `/messages/:id` | Update message status | Private |
| DELETE | `/messages/:id` | Delete a message | Private |

## Media API
Base path: `/api/v1/media`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List all media files | Private |
| POST | `/upload` | Upload a new media file | Private |
| GET | `/:id` | Get media details | Private |
| DELETE | `/:id` | Delete a media file | Private |
| POST | `/optimize` | Optimize a media file | Private |

## Notifications API
Base path: `/api/v1/notifications`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get user notifications | Private |
| PUT | `/:id/read` | Mark a notification as read | Private |
| PUT | `/read-all` | Mark all notifications as read | Private |
| DELETE | `/:id` | Delete a notification | Private |
| POST | `/subscribe` | Subscribe to push notifications | Private |
| DELETE | `/unsubscribe` | Unsubscribe from push notifications | Private |

## Skills API
Base path: `/api/v1/skills`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get all skills | Public |
| GET | `/:id` | Get a specific skill | Public |
| POST | `/` | Create a new skill | Private |
| PUT | `/:id` | Update a skill | Private |
| DELETE | `/:id` | Delete a skill | Private |
| POST | `/categories` | Create a skill category | Private |
| GET | `/categories` | Get all skill categories | Public |

## Experience API
Base path: `/api/v1/experience`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get all work experiences | Public |
| GET | `/:id` | Get a specific experience | Public |
| POST | `/` | Add a new work experience | Private |
| PUT | `/:id` | Update a work experience | Private |
| DELETE | `/:id` | Delete a work experience | Private |

## Education API
Base path: `/api/v1/education`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get all education entries | Public |
| GET | `/:id` | Get a specific education entry | Public |
| POST | `/` | Add a new education entry | Private |
| PUT | `/:id` | Update an education entry | Private |
| DELETE | `/:id` | Delete an education entry | Private |

## Testimonials API
Base path: `/api/v1/testimonials`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get all testimonials | Public |
| GET | `/:id` | Get a specific testimonial | Public |
| POST | `/` | Add a new testimonial | Private |
| PUT | `/:id` | Update a testimonial | Private |
| DELETE | `/:id` | Delete a testimonial | Private |

## Settings API
Base path: `/api/v1/settings`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get all settings | Public/Private |
| PUT | `/` | Update settings | Private |
| GET | `/:key` | Get a specific setting | Public/Private |
| PUT | `/:key` | Update a specific setting | Private |

## Search API
Base path: `/api/v1/search`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Global search across all content | Public |

## API Keys API
Base path: `/api/v1/api-keys`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List all API keys | Private |
| POST | `/` | Create a new API key | Private |
| GET | `/:id` | Get API key details | Private |
| PUT | `/:id` | Update API key | Private |
| PATCH | `/:id/revoke` | Revoke an API key | Private |
| DELETE | `/:id` | Delete an API key | Private |
| GET | `/stats/usage` | Get API key usage statistics | Admin |
| GET | `/permissions` | Get available API key permissions | Admin |

## Security API
Base path: `/api/v1/security`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/audit-logs` | Get security audit logs | Admin |
| GET | `/audit-logs/:id` | Get specific audit log entry | Admin |

## Admin API
Base path: `/api/v1/admin`

### User Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/users` | List all users | Admin |
| GET | `/users/:id` | Get user details | Admin |
| PUT | `/users/:id` | Update a user | Admin |
| DELETE | `/users/:id` | Delete a user | Admin |
| POST | `/users/:id/ban` | Ban a user | Admin |
| POST | `/users/:id/unban` | Unban a user | Admin |

### System Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/system/backup` | List available backups | Admin |
| POST | `/system/backup` | Create a new backup | Admin |
| GET | `/system/backup/:id` | Download a specific backup | Admin |
| DELETE | `/system/backup/:id` | Delete a backup | Admin |
| GET | `/system/audit` | Get system audit logs | Admin |
| GET | `/system/config` | Get system configuration | Admin |
| PUT | `/system/config` | Update system configuration | Admin |
| GET | `/system/cache` | Get cache statistics | Admin |
| POST | `/system/cache/clear` | Clear application cache | Admin |
| GET | `/system/logs` | Get application logs | Admin |
| GET | `/system/monitoring` | Get system monitoring data | Admin |
| GET | `/health` | Admin-specific health check | Admin |

## WebSocket API
Base path: `/api/websocket`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/connections` | Get all active WebSocket connections | Admin |
| GET | `/connections/:connectionId` | Get connection details | Admin |
| POST | `/connections/:connectionId/disconnect` | Disconnect a specific connection | Admin |
| GET | `/users/:userId/connections` | Get connections for a specific user | Admin/Self |
| POST | `/users/:userId/messages` | Send message to a specific user | Admin |

## System API

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/version` | Get API version information | Public |
| GET | `/health` | Basic health check | Public |
| GET | `/health/detailed` | Detailed health check | Private |

## WebSocket Messages
Base path: `/ws`

The WebSocket API provides real-time communication for:
- Live notifications
- Chat functionality
- Real-time content updates
- System events and broadcasts
- Content synchronization
- Collaboration features

## Notes

- **Public Access**: Endpoints that can be accessed without authentication
- **Private Access**: Endpoints that require user authentication
- **Admin Access**: Endpoints that require admin privileges 