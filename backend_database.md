# Portfolio Website Database Schema

This document outlines the database schema for the portfolio website backend, designed to support all the API endpoints specified in the backend API documentation.

## Database Overview

The database is designed using PostgreSQL and follows these principles:
- Normalized structure to minimize data redundancy
- Proper indexing for optimal query performance
- JSONB fields for flexible data storage
- Timestamp tracking for all records
- Referential integrity with foreign keys
- Enum types for constrained choices

## Schema Definition

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

#### Refresh Tokens Table
```sql
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

### Profile Management

#### Profiles Table
```sql
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200),
    bio TEXT,
    avatar_url VARCHAR(255),
    phone VARCHAR(20),
    location VARCHAR(100),
    social_links JSONB,
    resume_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
```

### Content Management

#### Projects Table
```sql
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    thumbnail_url VARCHAR(255),
    tags TEXT[],
    technologies TEXT[],
    github_url VARCHAR(255),
    live_url VARCHAR(255),
    is_featured BOOLEAN DEFAULT FALSE,
    status ENUM('draft', 'published') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_tags ON projects USING GIN(tags);
CREATE INDEX idx_projects_is_featured ON projects(is_featured);
CREATE INDEX idx_projects_created_at ON projects(created_at);
```

#### Blog Posts Table
```sql
CREATE TABLE blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt VARCHAR(500),
    featured_image VARCHAR(255),
    author_id INT REFERENCES users(id),
    category_id INT REFERENCES blog_categories(id),
    tags TEXT[],
    status ENUM('draft', 'published') DEFAULT 'draft',
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_created_at ON blog_posts(created_at);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);
-- Full-text search index
CREATE INDEX idx_blog_posts_content_search ON blog_posts USING GIN(to_tsvector('english', title || ' ' || content));
```

#### Blog Categories Table
```sql
CREATE TABLE blog_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);
```

#### Testimonials Table
```sql
CREATE TABLE testimonials (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(100) NOT NULL,
    author_title VARCHAR(200),
    content TEXT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_testimonials_user_id ON testimonials(user_id);
CREATE INDEX idx_testimonials_status ON testimonials(status);
```

#### Contact Submissions Table
```sql
CREATE TABLE contact_submissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'replied', 'archived') DEFAULT 'new',
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at);
```

### Media Management

#### Media Table
```sql
CREATE TABLE media (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    url VARCHAR(255) NOT NULL,
    type ENUM('image', 'document', 'video') NOT NULL,
    size INT,
    filename VARCHAR(255),
    description TEXT,
    visibility ENUM('public', 'private') DEFAULT 'public',
    metadata JSONB,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_media_user_id ON media(user_id);
CREATE INDEX idx_media_type ON media(type);
CREATE INDEX idx_media_visibility ON media(visibility);
```

### Experience and Education

#### Experience Table
```sql
CREATE TABLE experience (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    company VARCHAR(200) NOT NULL,
    start_date DATE,
    end_date DATE,
    description TEXT,
    technologies TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_experience_user_id ON experience(user_id);
```

#### Education Table
```sql
CREATE TABLE education (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    institution VARCHAR(200) NOT NULL,
    degree VARCHAR(100) NOT NULL,
    field_of_study VARCHAR(200),
    start_date DATE,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_education_user_id ON education(user_id);
```

### Settings and Configuration

#### Settings Table
```sql
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    site_name VARCHAR(100) NOT NULL,
    site_description TEXT,
    logo_url VARCHAR(255),
    favicon_url VARCHAR(255),
    theme JSONB,
    contact_info JSONB,
    social_links JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Notifications and Logging

#### Notifications Table
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
```

#### Audit Logs Table
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### Security

#### API Keys Table
```sql
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    permissions TEXT[],
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at);
```

### Rate Limiting

#### Rate Limit Tracking Table
```sql
CREATE TABLE rate_limits (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    request_count INT DEFAULT 1,
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_rate_limits_ip_endpoint ON rate_limits(ip_address, endpoint);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start, window_end);
```

### WebSocket Support

#### WebSocket Connections Table
```sql
CREATE TABLE websocket_connections (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    connection_id VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat TIMESTAMP,
    disconnected_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_websocket_connections_user_id ON websocket_connections(user_id);
CREATE INDEX idx_websocket_connections_connection_id ON websocket_connections(connection_id);
```

## Database Relationships

1. **One-to-One Relationships:**
   - User ↔ Profile
   - User ↔ Settings

2. **One-to-Many Relationships:**
   - User → Projects
   - User → Blog Posts
   - User → Media
   - User → Experience
   - User → Education
   - User → Notifications
   - User → Audit Logs

3. **Many-to-Many Relationships:**
   - Blog Posts ↔ Tags (using array)
   - Projects ↔ Technologies (using array)

## Indexing Strategy

1. **Primary Key Indexes:**
   - All tables have primary key indexes

2. **Foreign Key Indexes:**
   - All foreign key columns are indexed

3. **Search Optimization Indexes:**
   - Full-text search indexes on content fields
   - GIN indexes for array columns
   - B-tree indexes for frequently queried columns

4. **Composite Indexes:**
   - Created based on common query patterns
   - Optimized for sorting and filtering

## Data Types and Constraints

1. **Text Fields:**
   - VARCHAR for fixed-length strings
   - TEXT for variable-length content
   - JSONB for complex nested data

2. **Numeric Fields:**
   - SERIAL for auto-incrementing IDs
   - INT for whole numbers
   - DECIMAL for precise calculations

3. **Date/Time Fields:**
   - TIMESTAMP for precise datetime
   - DATE for date-only values

4. **Boolean Fields:**
   - BOOLEAN for true/false values

5. **Array Fields:**
   - TEXT[] for simple arrays
   - JSONB for complex arrays

## Security Considerations

1. **Password Storage:**
   - Passwords are hashed using bcrypt
   - Salt is automatically generated

2. **API Key Security:**
   - Keys are hashed before storage
   - Expiration dates are enforced
   - Usage tracking is implemented

3. **Audit Trail:**
   - All significant actions are logged
   - User attribution is maintained
   - Timestamps are recorded

## Performance Optimization

1. **Indexing:**
   - Strategic indexes for common queries
   - Partial indexes for filtered data
   - Regular index maintenance

2. **Partitioning:**
   - Large tables are partitioned by date
   - Helps manage historical data

3. **Caching:**
   - Frequently accessed data is cached
   - Cache invalidation strategy in place

## Maintenance

1. **Backup Strategy:**
   - Daily full backups
   - Hourly incremental backups
   - Point-in-time recovery enabled

2. **Vacuum Strategy:**
   - Regular VACUUM operations
   - Auto-vacuum configuration
   - Dead tuple cleanup

3. **Monitoring:**
   - Query performance tracking
   - Index usage statistics
   - Table size monitoring 