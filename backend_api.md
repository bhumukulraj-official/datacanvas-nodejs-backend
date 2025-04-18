# Portfolio Website Backend APIs

This document outlines the essential API endpoints for a single-person portfolio website with admin management.

## API Versioning
All endpoints are prefixed with `/api/v1/`

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2024-03-21T10:00:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {},
    "timestamp": "2024-03-21T10:00:00Z"
  }
}
```

### Pagination Metadata
```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## Rate Limiting
- Public APIs: 100 requests per minute
- Admin APIs: 1000 requests per minute
- WebSocket connections: 10 per IP
- Rate limit headers:
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets (Unix timestamp)
  - `Retry-After`: Seconds to wait before retrying (when limit exceeded)

## Security Headers
All API responses include the following security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: default-src 'self'`
- `X-Request-ID: <unique-request-id>`
- `X-API-Version: 1`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

## Authentication

### User Registration
- **Endpoint:** `POST /api/v1/auth/register`
  - **Description:** Register a new user
  - **Request Body:**
    ```json
    {
      "email": "string (required, email format)",
      "password": "string (required, min: 8 chars, must contain: uppercase, lowercase, number, special char)",
      "name": "string (required, max: 100)",
      "role": "string (enum: ['admin', 'user'], default: 'user')"
    }
    ```
  - **Response:** 
    ```json
    {
      "success": true,
      "data": {
        "id": "string",
        "email": "string",
        "name": "string",
        "role": "string",
        "createdAt": "string (ISO date)"
      },
      "message": "User registered successfully"
    }
    ```
  - **Error Codes:**
    - `VAL_001`: Validation error
    - `AUTH_005`: Email already exists
    - `AUTH_006`: Invalid password format

### Email Verification
- **Endpoint:** `POST /api/v1/auth/verify-email`
  - **Description:** Verify user email
  - **Request Body:**
    ```json
    {
      "token": "string (required)"
    }
    ```
  - **Response:** Success message
  - **Error Codes:**
    - `AUTH_007`: Invalid verification token
    - `AUTH_008`: Token expired

### Resend Verification Email
- **Endpoint:** `POST /api/v1/auth/resend-verification`
  - **Description:** Resend verification email
  - **Request Body:**
    ```json
    {
      "email": "string (required, email format)"
    }
    ```
  - **Response:** Success message
  - **Error Codes:**
    - `AUTH_009`: Email not found
    - `AUTH_010`: Email already verified

### JWT Token Format
```json
{
  "token": "string (JWT)",
  "refreshToken": "string",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

### Authentication Headers
```
Authorization: Bearer <token>
```

### Token Refresh
- **Endpoint:** `POST /api/v1/auth/refresh`
  - **Description:** Refresh access token using refresh token
  - **Request Body:**
    ```json
    {
      "refreshToken": "string"
    }
    ```
  - **Response:** New JWT token pair
  - **Error Codes:**
    - `AUTH_002`: Token expired
    - `AUTH_003`: Invalid token
    - `AUTH_004`: Refresh token expired

### Password Reset
- **Endpoint:** `POST /api/v1/auth/reset-password/request`
  - **Description:** Request password reset
  - **Request Body:**
    ```json
    {
      "email": "string (required, email format)"
    }
    ```
  - **Response:** Success message
  - **Error Codes:**
    - `AUTH_011`: Email not found
    - `RATE_002`: Too many reset requests

- **Endpoint:** `POST /api/v1/auth/reset-password/confirm`
  - **Description:** Confirm password reset
  - **Request Body:**
    ```json
    {
      "token": "string (required)",
      "newPassword": "string (required, min: 8 chars, must contain: uppercase, lowercase, number, special char)"
    }
    ```
  - **Response:** Success message
  - **Error Codes:**
    - `AUTH_012`: Invalid reset token
    - `AUTH_013`: Token expired
    - `VAL_001`: Invalid password format

### Change Password
- **Endpoint:** `POST /api/v1/auth/change-password`
  - **Description:** Change user password (authenticated)
  - **Authentication:** Required
  - **Request Body:**
    ```json
    {
      "currentPassword": "string (required)",
      "newPassword": "string (required, min: 8 chars, must contain: uppercase, lowercase, number, special char)"
    }
    ```
  - **Response:** Success message
  - **Error Codes:**
    - `AUTH_001`: Invalid credentials
    - `VAL_001`: Invalid password format

### Logout
- **Endpoint:** `POST /api/v1/auth/logout`
  - **Description:** Logout user and invalidate tokens
  - **Authentication:** Required
  - **Request Body:** None
  - **Response:** Success message
  - **Error Codes:**
    - `AUTH_001`: Invalid token

## 1. Public APIs

### Profile API
- **Endpoint:** `GET /api/v1/profile`
  - **Description:** Retrieve personal information, bio, skills, social links, and resume
  - **Response:** 
    ```json
    {
      "success": true,
      "data": {
        "personalInfo": {
          "name": "string",
          "title": "string",
          "bio": "string",
          "avatar": "string (URL)",
          "email": "string",
          "phone": "string",
          "location": "string"
        },
        "socialLinks": [
          {
            "platform": "string",
            "url": "string",
            "icon": "string"
          }
        ],
        "resume": "string (URL)"
      },
      "message": "Profile retrieved successfully",
      "timestamp": "2024-03-21T10:00:00Z"
    }
    ```
  - **Error Codes:**
    - `NOT_001`: Profile not found
    - `AUTH_001`: Unauthorized access

- **Endpoint:** `PUT /api/v1/profile`
  - **Description:** Update profile information
  - **Authentication:** Required
  - **Request Body:** 
    ```json
    {
      "personalInfo": {
        "name": "string (required, max: 100)",
        "title": "string (required, max: 200)",
        "bio": "string (required, max: 1000)",
        "email": "string (required, email format)",
        "phone": "string (optional, max: 20)",
        "location": "string (optional, max: 100)"
      },
      "socialLinks": [
        {
          "platform": "string (required, enum: ['github', 'linkedin', 'twitter', 'facebook'])",
          "url": "string (required, url format)"
        }
      ]
    }
    ```
  - **Response:** Updated profile data
  - **Error Codes:**
    - `VAL_001`: Validation error
    - `AUTH_001`: Unauthorized access
    - `PERM_001`: Permission denied

### Profile Avatar Management
- **Endpoint:** `POST /api/v1/profile/avatar`
  - **Description:** Upload or update profile avatar
  - **Authentication:** Required
  - **Request Body:** Multipart form data
    - `file`: Image file (required, max: 5MB, formats: JPG, PNG, WebP)
  - **Response:** 
    ```json
    {
      "success": true,
      "data": {
        "avatarUrl": "string",
        "thumbnailUrl": "string"
      }
    }
    ```
  - **Error Codes:**
    - `FILE_001`: File too large
    - `FILE_002`: Invalid file type
    - `FILE_003`: Upload failed

### Resume Management
- **Endpoint:** `POST /api/v1/profile/resume`
  - **Description:** Upload or update resume
  - **Authentication:** Required
  - **Request Body:** Multipart form data
    - `file`: Document file (required, max: 10MB, formats: PDF, DOC, DOCX)
  - **Response:** 
    ```json
    {
      "success": true,
      "data": {
        "resumeUrl": "string",
        "uploadedAt": "string (ISO date)"
      }
    }
    ```
  - **Error Codes:**
    - `FILE_001`: File too large
    - `FILE_002`: Invalid file type
    - `FILE_003`: Upload failed

### Projects API
- **Endpoint:** `GET /api/v1/projects`
  - **Description:** Retrieve all projects with pagination
  - **Query Parameters:** 
    - `page`: Page number (default: 1, min: 1)
    - `limit`: Items per page (default: 10, min: 1, max: 50)
    - `sort`: Sort field (default: "createdAt", enum: ["createdAt", "title", "updatedAt"])
    - `order`: Sort order ("asc" or "desc")
    - `tags`: Filter by tags (comma-separated)
  - **Response:** 
    ```json
    {
      "success": true,
      "data": {
        "projects": [
          {
            "id": "string",
            "title": "string",
            "description": "string",
            "thumbnail": "string (URL)",
            "tags": ["string"],
            "technologies": ["string"],
            "githubUrl": "string",
            "liveUrl": "string",
            "createdAt": "string (ISO date)",
            "updatedAt": "string (ISO date)"
          }
        ],
        "pagination": {
          "currentPage": 1,
          "totalPages": 10,
          "totalItems": 100,
          "itemsPerPage": 10,
          "hasNextPage": true,
          "hasPreviousPage": false
        }
      },
      "message": "Projects retrieved successfully",
      "timestamp": "2024-03-21T10:00:00Z"
    }
    ```
  - **Error Codes:**
    - `VAL_001`: Invalid query parameters
    - `NOT_001`: No projects found

### Media Upload Specifications
- **Supported Formats:**
  - Images: JPG, PNG, GIF, WebP (max 5MB)
  - Documents: PDF, DOC, DOCX (max 10MB)
  - Videos: MP4, WebM (max 50MB)
- **Image Requirements:**
  - Thumbnails: 300x300px, JPG/PNG
  - Project images: 1200x800px, JPG/PNG
  - Avatar: 200x200px, JPG/PNG
- **Storage:**
  - Files stored in CDN
  - Automatic image optimization
  - 30-day retention for unused files

### WebSocket Protocol

#### Connection
```
WS /api/v1/ws/notifications?token=<jwt_token>
```

#### Authentication
- JWT token required for connection
- Token validation on connection
- Automatic reconnection with exponential backoff
- Connection timeout: 30 seconds

#### Message Format
```json
{
  "type": "string (enum: ['notification', 'message', 'status', 'error'])",
  "payload": {},
  "timestamp": "string (ISO date)",
  "messageId": "string (unique)"
}
```

#### Events
1. **Notification**
   ```json
   {
     "type": "notification",
     "payload": {
       "id": "string",
       "title": "string",
       "message": "string",
       "read": false,
       "priority": "string (enum: ['low', 'medium', 'high'])",
       "category": "string"
     }
   }
   ```

2. **Message**
   ```json
   {
     "type": "message",
     "payload": {
       "id": "string",
       "sender": "string",
       "content": "string",
       "timestamp": "string (ISO date)",
       "metadata": {
         "type": "string",
         "attachments": []
       }
     }
   }
   ```

3. **Status**
   ```json
   {
     "type": "status",
     "payload": {
       "status": "string (enum: ['connected', 'disconnected', 'error', 'reconnecting'])",
       "message": "string",
       "code": "number (optional)"
     }
   }
   ```

4. **Error**
   ```json
   {
     "type": "error",
     "payload": {
       "code": "string",
       "message": "string",
       "reconnect": true,
       "retryAfter": "number (seconds)"
     }
   }
   ```

#### Reconnection Strategy
- Exponential backoff: 1s, 2s, 4s, 8s, 16s
- Maximum retry attempts: 5
- Reconnect on specific error codes only
- Connection health check every 30 seconds
- Automatic reconnection on network issues

#### Rate Limiting
- Maximum message size: 1MB
- Message rate limit: 100 messages per minute
- Connection limit: 10 per IP
- Heartbeat interval: 30 seconds

#### Error Handling
```json
{
  "type": "error",
  "payload": {
    "code": "string",
    "message": "string",
    "reconnect": true,
    "retryAfter": "number (seconds)"
  }
}
```

#### Error Codes
- `WS_001`: Connection failed
- `WS_002`: Authentication failed
- `WS_003`: Invalid message format
- `WS_004`: Rate limit exceeded
- `WS_005`: Connection timeout
- `WS_006`: Server error

### Search Implementation
- **Endpoint:** `GET /api/v1/search`
  - **Description:** Global search across all content
  - **Query Parameters:**
    - `q`: Search query (required, min: 2 chars)
    - `type`: Content type (optional, enum: ["projects", "skills", "experience"])
    - `page`: Page number (default: 1)
    - `limit`: Results per page (default: 10, max: 50)
  - **Response:**
    ```json
    {
      "success": true,
      "data": {
        "results": [
          {
            "type": "string",
            "id": "string",
            "title": "string",
            "description": "string",
            "url": "string",
            "score": "number",
            "highlightedText": "string"
          }
        ],
        "pagination": {},
        "metadata": {
          "totalResults": "number",
          "searchTime": "number (ms)",
          "suggestions": ["string"]
        }
      }
    }
    ```

### Health Check
- **Endpoint:** `GET /api/v1/health`
  - **Description:** Check API health status
  - **Response:**
    ```json
    {
      "status": "healthy",
      "version": "1.0.0",
      "timestamp": "2024-03-21T10:00:00Z",
      "services": {
        "database": {
          "status": "up",
          "latency": "number (ms)",
          "lastChecked": "string (ISO date)"
        },
        "cache": {
          "status": "up",
          "latency": "number (ms)",
          "lastChecked": "string (ISO date)"
        },
        "storage": {
          "status": "up",
          "latency": "number (ms)",
          "lastChecked": "string (ISO date)"
        }
      }
    }
    ```

### Error Codes
- `AUTH_001`: Invalid credentials
- `AUTH_002`: Token expired
- `AUTH_003`: Invalid token
- `AUTH_004`: Refresh token expired
- `VAL_001`: Validation error
- `VAL_002`: Invalid input format
- `NOT_001`: Resource not found
- `PERM_001`: Permission denied
- `RATE_001`: Rate limit exceeded
- `FILE_001`: File too large
- `FILE_002`: Invalid file type
- `FILE_003`: File upload failed
- `DB_001`: Database error
- `CACHE_001`: Cache error
- `WS_001`: WebSocket connection error
- `WS_002`: WebSocket message error

### API Best Practices
1. Always use HTTPS
2. Include API version in URL
3. Use proper HTTP methods
4. Return appropriate status codes
5. Include pagination for list endpoints
6. Implement rate limiting
7. Use proper authentication
8. Validate input data
9. Handle errors gracefully
10. Cache responses when possible
11. Use compression
12. Log API requests
13. Monitor API performance
14. Document API changes
15. Maintain backward compatibility

### Performance Requirements
- Response time: < 200ms for 95% of requests
- Availability: 99.9%
- Cache hit ratio: > 80%
- Rate limit: 100 requests/minute for public APIs
- WebSocket connection: < 100ms establishment time

### Monitoring and Logging
- Request logging with correlation IDs
- Performance metrics collection
- Error tracking and alerting
- Usage analytics
- Security audit logging

### Versioning Strategy
- URL-based versioning: `/api/v1/`
- Version header: `X-API-Version: 1`
- Deprecation notice header: `Warning: 299 - "This API version is deprecated"`
- 6-month deprecation notice before breaking changes
- Version migration guide provided

### Security Requirements
- Password hashing: bcrypt with salt
- JWT token expiration: 1 hour
- Refresh token expiration: 7 days
- API key rotation: Every 90 days
- Session timeout: 30 minutes
- Failed login attempts: Max 5 before lockout
- IP whitelisting for admin access
- Regular security audits
- SSL/TLS 1.3 required
- Input sanitization
- XSS protection
- CSRF protection
- SQL injection prevention

## 2. Admin APIs

### Authentication
- **Endpoint:** `POST /api/v1/admin/login`
  - **Description:** Admin login
  - **Request Body:** Credentials
  - **Response:** Authentication token

- **Endpoint:** `POST /api/v1/admin/logout`
  - **Description:** Admin logout
  - **Response:** Success message

### Dashboard
- **Endpoint:** `GET /api/v1/admin/dashboard`
  - **Description:** Get admin dashboard analytics and summaries
  - **Response:** Dashboard data including counts and statistics

### Content Management

#### Projects Management
- **Endpoint:** `POST /api/v1/admin/projects`
  - **Description:** Create a new project
  - **Request Body:** Project data
  - **Response:** Created project data

- **Endpoint:** `PUT /api/v1/admin/projects/:id`
  - **Description:** Update existing project
  - **Parameters:** Project ID
  - **Request Body:** Updated project data
  - **Response:** Updated project data

- **Endpoint:** `DELETE /api/v1/admin/projects/:id`
  - **Description:** Remove a project
  - **Parameters:** Project ID
  - **Response:** Success/error message

#### Skills Management
- **Endpoint:** `POST /api/v1/admin/skills`
  - **Description:** Add a new skill
  - **Request Body:** Skill data
  - **Response:** Created skill data

- **Endpoint:** `PUT /api/v1/admin/skills/:id`
  - **Description:** Update existing skill
  - **Parameters:** Skill ID
  - **Request Body:** Updated skill data
  - **Response:** Updated skill data

- **Endpoint:** `DELETE /api/v1/admin/skills/:id`
  - **Description:** Remove a skill
  - **Parameters:** Skill ID
  - **Response:** Success/error message

#### Experience Management
- **Endpoint:** `POST /api/v1/admin/experience`
  - **Description:** Add new work experience
  - **Request Body:** Experience data
  - **Response:** Created experience data

- **Endpoint:** `PUT /api/v1/admin/experience/:id`
  - **Description:** Update work experience
  - **Parameters:** Experience ID
  - **Request Body:** Updated experience data
  - **Response:** Updated experience data

- **Endpoint:** `DELETE /api/v1/admin/experience/:id`
  - **Description:** Remove work experience
  - **Parameters:** Experience ID
  - **Response:** Success/error message

#### Education Management
- **Endpoint:** `POST /api/v1/admin/education`
  - **Description:** Add new education entry
  - **Request Body:** Education data
  - **Response:** Created education data

- **Endpoint:** `PUT /api/v1/admin/education/:id`
  - **Description:** Update education entry
  - **Parameters:** Education ID
  - **Request Body:** Updated education data
  - **Response:** Updated education data

- **Endpoint:** `DELETE /api/v1/admin/education/:id`
  - **Description:** Remove education entry
  - **Parameters:** Education ID
  - **Response:** Success/error message

#### Testimonials Management
- **Endpoint:** `POST /api/v1/admin/testimonials`
  - **Description:** Add new testimonial
  - **Request Body:** Testimonial data
  - **Response:** Created testimonial data

- **Endpoint:** `PUT /api/v1/admin/testimonials/:id`
  - **Description:** Update testimonial
  - **Parameters:** Testimonial ID
  - **Request Body:** Updated testimonial data
  - **Response:** Updated testimonial data

- **Endpoint:** `DELETE /api/v1/admin/testimonials/:id`
  - **Description:** Remove testimonial
  - **Parameters:** Testimonial ID
  - **Response:** Success/error message

### User Management
- **Endpoint:** `GET /api/v1/admin/users`
  - **Description:** Retrieve all admin users
  - **Response:** List of users

- **Endpoint:** `POST /api/v1/admin/users`
  - **Description:** Create a new admin user
  - **Request Body:** User data
  - **Response:** Created user data

- **Endpoint:** `PUT /api/v1/admin/users/:id`
  - **Description:** Update admin user
  - **Parameters:** User ID
  - **Request Body:** Updated user data
  - **Response:** Updated user data

- **Endpoint:** `DELETE /api/v1/admin/users/:id`
  - **Description:** Remove admin user
  - **Parameters:** User ID
  - **Response:** Success/error message

### Media Management
- **Endpoint:** `POST /api/v1/media/upload`
  - **Description:** Upload media files
  - **Authentication:** Required
  - **Request Body:** Multipart form data
    - `file`: Media file (required)
    - `type`: Media type (required, enum: ['image', 'document', 'video'])
    - `description`: File description (optional)
  - **Supported Formats:** 
    - Images: JPG, PNG, GIF, WebP (max 5MB)
    - Documents: PDF, DOC, DOCX (max 10MB)
    - Videos: MP4, WebM (max 50MB)
  - **Response:** 
    ```json
    {
      "success": true,
      "data": {
        "id": "string",
        "url": "string",
        "type": "string",
        "size": "number",
        "filename": "string",
        "uploadedAt": "string (ISO date)",
        "metadata": {
          "width": "number (for images)",
          "height": "number (for images)",
          "duration": "number (for videos)",
          "pages": "number (for documents)"
        }
      }
    }
    ```
  - **Error Codes:**
    - `FILE_001`: File too large
    - `FILE_002`: Invalid file type
    - `FILE_003`: Upload failed
    - `VAL_001`: Invalid media type

- **Endpoint:** `GET /api/v1/media`
  - **Description:** Get all media files with pagination
  - **Authentication:** Required
  - **Query Parameters:**
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 20, max: 100)
    - `type`: Filter by media type
    - `search`: Search by filename
  - **Response:** List of media files with pagination

- **Endpoint:** `DELETE /api/v1/media/:id`
  - **Description:** Delete media file
  - **Authentication:** Required
  - **Parameters:** Media ID
  - **Response:** Success message
  - **Error Codes:**
    - `NOT_001`: Media not found
    - `PERM_001`: Permission denied

### Media Optimization
- **Endpoint:** `POST /api/v1/media/:id/optimize`
  - **Description:** Optimize media file
  - **Authentication:** Required
  - **Parameters:** Media ID
  - **Request Body:**
    ```json
    {
      "quality": "number (1-100, default: 80)",
      "format": "string (enum: ['jpg', 'png', 'webp'])",
      "width": "number (optional)",
      "height": "number (optional)"
    }
    ```
  - **Response:** Optimized media details
  - **Error Codes:**
    - `NOT_001`: Media not found
    - `VAL_001`: Invalid optimization parameters
    - `FILE_004`: Optimization failed

### Settings Management
- **Endpoint:** `GET /api/v1/admin/settings`
  - **Description:** Get admin settings
  - **Response:** Settings data

- **Endpoint:** `PUT /api/v1/admin/settings`
  - **Description:** Update admin settings
  - **Request Body:** Settings data
  - **Response:** Updated settings

### Backup and Restore
- **Endpoint:** `POST /api/v1/admin/backup`
  - **Description:** Create a backup of the database
  - **Response:** Success message with backup details

- **Endpoint:** `POST /api/v1/admin/restore`
  - **Description:** Restore the database from a backup
  - **Request Body:** Backup details
  - **Response:** Success/error message

### Audit Logging
- **Endpoint:** `GET /api/v1/admin/logs`
  - **Description:** Retrieve admin action logs
  - **Query Parameters:**
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 50)
    - `startDate`: Filter logs from date
    - `endDate`: Filter logs to date
  - **Response:** List of log entries with pagination metadata

## Notification API
- **Endpoint:** `GET /api/v1/notifications`
  - **Description:** Get user notifications
  - **Query Parameters:**
    - `page`: Page number
    - `limit`: Items per page
    - `read`: Filter by read status
  - **Response:**
    ```json
    {
      "success": true,
      "data": {
        "notifications": [
          {
            "id": "string",
            "type": "string",
            "message": "string",
            "read": "boolean",
            "createdAt": "string (ISO)"
          }
        ],
        "pagination": {}
      }
    }
    ```

- **Endpoint:** `PUT /api/v1/notifications/:id/read`
  - **Description:** Mark notification as read
  - **Response:**
    ```json
    {
      "success": true,
      "data": {
        "id": "string",
        "read": true,
        "updatedAt": "string (ISO)"
      }
    }
    ```

## Request Examples

### Create Project
```bash
curl -X POST /api/v1/admin/projects \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Project Title",
    "description": "Project Description",
    "tags": ["web", "react"],
    "technologies": ["React", "Node.js"],
    "githubUrl": "https://github.com/...",
    "liveUrl": "https://..."
  }'
```

### Upload Media
```bash
curl -X POST /api/v1/admin/media/upload \
  -H "Authorization: Bearer {token}" \
  -F "file=@image.jpg" \
  -F "type=image" \
  -F "description=Project thumbnail"
```

## Error Codes
- `AUTH_001`: Invalid credentials
- `AUTH_002`: Token expired
- `AUTH_003`: Invalid token
- `VAL_001`: Validation error
- `NOT_001`: Resource not found
- `PERM_001`: Permission denied
- `RATE_001`: Rate limit exceeded
- `FILE_001`: File too large
- `FILE_002`: Invalid file type

## API Best Practices
1. Always use HTTPS
2. Include API version in URL
3. Use proper HTTP methods
4. Return appropriate status codes
5. Include pagination for list endpoints
6. Implement rate limiting
7. Use proper authentication
8. Validate input data
9. Handle errors gracefully
10. Cache responses when possible
11. Use compression
12. Log API requests
13. Monitor API performance
14. Document API changes
15. Maintain backward compatibility

### Contact Form
- **Endpoint:** `POST /api/v1/contact`
  - **Description:** Submit contact form
  - **Request Body:**
    ```json
    {
      "name": "string (required, max: 100)",
      "email": "string (required, email format)",
      "subject": "string (required, max: 200)",
      "message": "string (required, max: 1000)",
      "recaptchaToken": "string (required)"
    }
    ```
  - **Response:** Success message
  - **Error Codes:**
    - `VAL_001`: Validation error
    - `RATE_003`: Too many contact submissions
    - `CAPTCHA_001`: Invalid captcha

### Blog Management
- **Endpoint:** `GET /api/v1/blog/posts`
  - **Description:** Get all blog posts with pagination
  - **Query Parameters:**
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10, max: 50)
    - `category`: Filter by category
    - `tag`: Filter by tag
    - `search`: Search in title and content
  - **Response:** 
    ```json
    {
      "success": true,
      "data": {
        "posts": [
          {
            "id": "string",
            "title": "string",
            "slug": "string",
            "content": "string",
            "excerpt": "string",
            "featuredImage": "string (URL)",
            "author": {
              "id": "string",
              "name": "string",
              "avatar": "string (URL)"
            },
            "category": "string",
            "tags": ["string"],
            "status": "string (enum: ['draft', 'published'])",
            "publishedAt": "string (ISO date)",
            "createdAt": "string (ISO date)",
            "updatedAt": "string (ISO date)"
          }
        ],
        "pagination": {}
      }
    }
    ```

- **Endpoint:** `GET /api/v1/blog/posts/:slug`
  - **Description:** Get single blog post
  - **Parameters:** Post slug
  - **Response:** Blog post details
  - **Error Codes:**
    - `NOT_001`: Post not found

- **Endpoint:** `POST /api/v1/admin/blog/posts`
  - **Description:** Create new blog post
  - **Authentication:** Required (Admin)
  - **Request Body:**
    ```json
    {
      "title": "string (required, max: 200)",
      "content": "string (required)",
      "excerpt": "string (required, max: 500)",
      "featuredImage": "string (URL)",
      "category": "string (required)",
      "tags": ["string"],
      "status": "string (enum: ['draft', 'published'])"
    }
    ```
  - **Response:** Created post data
  - **Error Codes:**
    - `VAL_001`: Validation error
    - `AUTH_001`: Unauthorized access
    - `PERM_001`: Permission denied

- **Endpoint:** `PUT /api/v1/admin/blog/posts/:id`
  - **Description:** Update blog post
  - **Authentication:** Required (Admin)
  - **Parameters:** Post ID
  - **Request Body:** Updated post data
  - **Response:** Updated post data
  - **Error Codes:**
    - `NOT_001`: Post not found
    - `VAL_001`: Validation error
    - `AUTH_001`: Unauthorized access
    - `PERM_001`: Permission denied

- **Endpoint:** `DELETE /api/v1/admin/blog/posts/:id`
  - **Description:** Delete blog post
  - **Authentication:** Required (Admin)
  - **Parameters:** Post ID
  - **Response:** Success message
  - **Error Codes:**
    - `NOT_001`: Post not found
    - `AUTH_001`: Unauthorized access
    - `PERM_001`: Permission denied

### Blog Categories
- **Endpoint:** `GET /api/v1/blog/categories`
  - **Description:** Get all blog categories
  - **Response:** List of categories

- **Endpoint:** `POST /api/v1/admin/blog/categories`
  - **Description:** Create new category
  - **Authentication:** Required (Admin)
  - **Request Body:**
    ```json
    {
      "name": "string (required, max: 100)",
      "slug": "string (required, max: 100)",
      "description": "string (optional)"
    }
    ```
  - **Response:** Created category data

- **Endpoint:** `PUT /api/v1/admin/blog/categories/:id`
  - **Description:** Update category
  - **Authentication:** Required (Admin)
  - **Parameters:** Category ID
  - **Request Body:** Updated category data
  - **Response:** Updated category data

- **Endpoint:** `DELETE /api/v1/admin/blog/categories/:id`
  - **Description:** Delete category
  - **Authentication:** Required (Admin)
  - **Parameters:** Category ID
  - **Response:** Success message

### Site Settings
- **Endpoint:** `GET /api/v1/settings`
  - **Description:** Get public site settings
  - **Response:** 
    ```json
    {
      "success": true,
      "data": {
        "siteName": "string",
        "siteDescription": "string",
        "logo": "string (URL)",
        "favicon": "string (URL)",
        "theme": {
          "primaryColor": "string",
          "secondaryColor": "string"
        },
        "socialLinks": [
          {
            "platform": "string",
            "url": "string"
          }
        ],
        "contact": {
          "email": "string",
          "phone": "string",
          "address": "string"
        }
      }
    }
    ```

- **Endpoint:** `GET /api/v1/admin/settings`
  - **Description:** Get all site settings (admin)
  - **Authentication:** Required (Admin)
  - **Response:** Complete settings data

- **Endpoint:** `PUT /api/v1/admin/settings`
  - **Description:** Update site settings
  - **Authentication:** Required (Admin)
  - **Request Body:** Updated settings data
  - **Response:** Updated settings data

## Security Specifications

### API Key Management
- **Endpoint:** `GET /api/v1/admin/api-keys`
  - **Description:** Get all API keys
  - **Authentication:** Required (Admin)
  - **Response:** List of API keys

- **Endpoint:** `POST /api/v1/admin/api-keys`
  - **Description:** Create new API key
  - **Authentication:** Required (Admin)
  - **Request Body:**
    ```json
    {
      "name": "string (required)",
      "expiresIn": "number (days)",
      "permissions": ["string"]
    }
    ```
  - **Response:** Created API key data

- **Endpoint:** `DELETE /api/v1/admin/api-keys/:id`
  - **Description:** Revoke API key
  - **Authentication:** Required (Admin)
  - **Parameters:** API key ID
  - **Response:** Success message

### CORS Policy
```json
{
  "origin": ["https://yourdomain.com"],
  "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "allowedHeaders": ["Content-Type", "Authorization", "X-API-Key"],
  "exposedHeaders": ["X-RateLimit-Limit", "X-RateLimit-Remaining"],
  "maxAge": 86400,
  "credentials": true
}
```

### File Upload Security
- Virus scanning for all uploads
- File type validation
- File size limits
- Secure file storage
- CDN integration
- Automatic image optimization
- File versioning
- Secure file deletion
- Access control
- File metadata tracking

### Session Management
- Session timeout: 30 minutes
- Maximum concurrent sessions: 5
- Session invalidation on password change
- IP tracking
- Device tracking
- Session activity logging

### Password Policy
- Minimum length: 8 characters
- Must contain:
  - Uppercase letter
  - Lowercase letter
  - Number
  - Special character
- Maximum age: 90 days
- Password history: 5 previous passwords
- Account lockout: 5 failed attempts
- Lockout duration: 15 minutes 