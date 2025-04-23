# Notification System

The DataCanvas notification system provides comprehensive functionality for managing and delivering notifications to users across multiple channels, including real-time WebSockets, email, and web push notifications.

## Features

- **Multiple Notification Channels**
  - Real-time notifications via WebSocket
  - Email notifications with HTML and text formats
  - Web push notifications
  - Daily and weekly email digests

- **User Preferences**
  - Per-channel notification preferences (email, push)
  - Per-category notification preferences
  - Default preferences for new users

- **Notification Templates**
  - Category-specific templates
  - Support for all delivery channels
  - Customizable content

- **Notification Analytics**
  - Track notification views and actions
  - User-specific analytics
  - System-wide analytics for administrators
  - Performance metrics (time-to-read, etc.)

- **Scheduled Notifications**
  - Schedule notifications for future delivery
  - Recurring notifications
  - Bulk notification creation

## Architecture

The notification system is built on a modular architecture with the following components:

1. **Core Notification Service**
   - Create, read, update, and delete notifications
   - Query notifications with filtering and pagination
   - Scheduled notification processing

2. **User Preferences**
   - Stored in user metadata to avoid schema changes
   - Default preferences provided for new users
   - Used to filter notifications based on user preferences

3. **Delivery Channels**
   - WebSocket service for real-time notifications
   - Email service for email notifications and digests
   - Push service for web push notifications

4. **Analytics**
   - Tracks notification creation, delivery, and engagement
   - Provides metrics for measuring notification effectiveness
   - Uses existing metadata fields to store analytics data

## API Endpoints

### Notifications

- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Create a notification
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read/all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete a notification

### Preferences

- `GET /api/notifications/preferences` - Get user notification preferences
- `PUT /api/notifications/preferences` - Update user notification preferences
- `POST /api/notifications/preferences/reset` - Reset preferences to defaults

### Push Notifications

- `POST /api/notifications/push/subscribe` - Subscribe to push notifications
- `POST /api/notifications/push/unsubscribe` - Unsubscribe from push notifications
- `GET /api/notifications/push/subscriptions` - Get user's push subscriptions
- `GET /api/notifications/push/vapid-public-key` - Get VAPID public key

### Analytics

- `GET /api/notifications/analytics/user` - Get user's notification analytics
- `POST /api/notifications/analytics/track` - Track notification action
- `GET /api/notifications/analytics/system` - Get system-wide analytics (admin only)

## Configuration

### Environment Variables

```
# WebSocket Configuration
WS_RATE_LIMIT_WINDOW_MS=60000
WS_RATE_LIMIT_MAX_MESSAGES=50
WS_PATH=/api/v1/ws
WS_MAX_PAYLOAD_SIZE=1048576
WS_HEARTBEAT_INTERVAL=30000

# Web Push VAPID Keys
VAPID_PUBLIC_KEY=<your_public_key>
VAPID_PRIVATE_KEY=<your_private_key>
VAPID_SUBJECT=mailto:notifications@datacanvas.io
```

## Generating VAPID Keys

To generate VAPID keys for web push notifications, run:

```bash
npx web-push generate-vapid-keys
```

Copy the output to your `.env` file.

## Database Schema

The notification system uses the following database tables:

1. `notifications` - Stores notification data
2. `push_subscriptions` - Stores web push subscription data

## Additional Resources

- [Web Push Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) 