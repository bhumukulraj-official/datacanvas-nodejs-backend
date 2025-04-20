# API Versioning Strategy

This document outlines the API versioning strategy used in the application.

## Overview

We use a hybrid versioning approach that supports both URL path versioning and request header versioning to ensure backward compatibility and provide a clear migration path for API consumers.

## Versioning Mechanisms

### 1. URL Path Versioning

URL path versioning is the primary method used. The API version is included in the URL path:

```
https://api.example.com/api/v1/projects
```

This approach is simple, explicit, and easy to test. It allows different versions of the API to coexist.

### 2. Accept-Version Header

For clients that prefer to use headers, we also support specifying the API version via the `Accept-Version` header:

```
GET /api/projects
Accept-Version: v1
```

URL path versioning takes precedence over the header versioning if both are specified.

### 3. Default Version

If no version is specified, the request is routed to the default version (currently `v1`).

## Version Information

### Headers

All API responses include version headers:

- `X-API-Version`: The version used for the current request
- `X-API-Latest-Version`: The latest stable API version available

For deprecated versions, additional headers are provided:

- `X-API-Deprecated`: Set to "true" if the version is deprecated
- `X-API-Deprecation-Date`: The date when the version will be or was deprecated
- `X-API-Replacement-Version`: The recommended version to upgrade to

### Response Body

Version information is also included in the response body metadata:

```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Example"
  },
  "metadata": {
    "apiVersion": "v1",
    "releaseDate": "2023-01-01",
    "deprecationDate": null
  }
}
```

For deprecated versions, a warning is included:

```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Example"
  },
  "warning": {
    "message": "API version v1 will be deprecated on 2024-01-01. Please upgrade to v2.",
    "deprecationDate": "2024-01-01",
    "replacementVersion": "v2"
  },
  "metadata": {
    "apiVersion": "v1",
    "releaseDate": "2023-01-01",
    "deprecationDate": "2024-01-01"
  }
}
```

## Version Lifecycle

1. **Active**: Current stable version of the API
2. **Deprecated**: Version is still available but will be removed in the future
3. **Retired**: Version is no longer available

### Deprecation Policy

- Major version changes are communicated at least 6 months in advance
- Deprecated versions remain available for at least 12 months
- Deprecation dates are communicated via API response headers and metadata
- Breaking changes are only introduced in new major versions

## Adding a New API Version

When a new API version is required:

1. Create a new directory in `src/api/` (e.g., `v2/`)
2. Create a new routes file structure, copying and modifying the previous version
3. Update `SUPPORTED_VERSIONS` in `src/shared/middleware/version.middleware.js`
4. Set `LATEST_VERSION` to the new version
5. Add routes to the API version router in `src/api/index.js`

### When to Create a New Version

Create a new API version when:
- Breaking changes are introduced (e.g., removing fields, changing response format)
- Major changes to resource representations
- Significant changes to business logic that affect API behavior

Avoid creating new versions for:
- Adding new endpoints
- Adding optional fields
- Bug fixes
- Performance improvements

## Migration Strategy

To help API consumers migrate to newer versions:

1. Document all changes between versions clearly
2. Provide example migration paths and code samples
3. Create a transition period where both versions are available
4. Communicate deprecation timelines clearly
5. Consider providing a migration tool if the changes are complex

## Versioning Endpoints

### Version Info Endpoint

Provides information about the current API version:

```
GET /api/v1/version
```

Response:

```json
{
  "success": true,
  "data": {
    "version": "v1",
    "releaseDate": "2023-01-01",
    "deprecationDate": null,
    "isDeprecated": false,
    "endpoints": [
      { "path": "/auth", "description": "Authentication endpoints" },
      { "path": "/profile", "description": "User profile management" }
    ]
  }
}
``` 