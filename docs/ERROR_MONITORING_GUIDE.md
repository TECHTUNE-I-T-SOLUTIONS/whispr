# Production Error Monitoring Setup

## Overview

This system captures all client-side runtime errors and automatically notifies the admin in real-time via the notifications system.

## Database Schema

### error_logs Table
Main table for storing error information:

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Unique error identifier |
| `message` | TEXT | Error message |
| `stack` | TEXT | Full stack trace |
| `url` | TEXT | URL where error occurred |
| `user_agent` | TEXT | Browser/device info |
| `source` | VARCHAR(50) | Error type: 'onerror' or 'unhandledrejection' |
| `timestamp` | BIGINT | Client-side timestamp (ms) |
| `created_at` | TIMESTAMP | Server timestamp |
| `error_hash` | VARCHAR(100) | SHA256 hash for deduplication |
| `resolved` | BOOLEAN | Admin resolution status |
| `resolved_at` | TIMESTAMP | When admin marked as resolved |
| `resolved_by` | UUID | Admin who resolved it |
| `notes` | TEXT | Admin notes about the error |
| `next_version` | VARCHAR(50) | Next.js build version |
| `build_id` | VARCHAR(100) | Build identifier |
| `environment` | VARCHAR(50) | Environment (production/staging) |
| `session_id` | VARCHAR(100) | Client session ID |
| `user_id` | UUID | Authenticated user (if available) |
| `occurrence_count` | INTEGER | How many times this error occurred (deduplication) |
| `last_occurrence_at` | TIMESTAMP | Last time this error occurred |

### Key Features

- **Automatic Deduplication**: Similar errors within 24 hours are bundled together
- **Notification Integration**: Admin gets notified via notifications table when errors occur
- **RLS Protected**: Only admin can view/manage error logs
- **Indexed for Performance**: Optimized queries for dashboard and monitoring
- **Statistics Tracking**: Views for error trends and patterns

## Setup Instructions

### 1. Run the SQL Migration

Execute the SQL file in Supabase:

```bash
# In Supabase SQL Editor, run:
# sql-migrations/create-error-logs-table.sql
```

This will create:
- `error_logs` table
- `error_log_notifications` table
- Triggers for auto-notifications
- Helper functions and views
- RLS policies

### 2. Verify API Route

The `/api/client-error` POST endpoint now:
- Accepts error data from the client
- Inserts into `error_logs` table
- Automatically triggers notification creation
- Deduplicates similar errors

```typescript
// Error data format sent by client:
{
  message: string          // Error message
  stack: string            // Full stack trace
  url: string              // URL where error occurred
  userAgent: string        // Browser info
  ts: number              // Client timestamp
  source: string          // 'onerror' | 'unhandledrejection'
}
```

## API Endpoints

### 1. List Error Logs
**GET** `/api/admin/error-logs`

Query Parameters:
- `limit` (default: 50) - Items per page
- `offset` (default: 0) - Pagination offset
- `resolved` (optional) - Filter by resolved status
- `source` (optional) - Filter by error source
- `sortBy` (default: created_at) - Sort field
- `sortOrder` (default: desc) - 'asc' or 'desc'

Response:
```json
{
  "errors": [...],
  "total": 150,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```

### 2. Get Single Error
**GET** `/api/admin/error-logs/[id]`

Returns full error details including stack trace.

### 3. Mark Error as Resolved
**PATCH** `/api/admin/error-logs/[id]`

Request Body:
```json
{
  "resolved": true,
  "notes": "Fixed in v1.2.0"
}
```

### 4. Get Error Statistics
**GET** `/api/admin/error-logs/stats`

Response:
```json
{
  "summary": {
    "totalErrors": 1250,
    "unresolvedErrors": 45,
    "unique24h": 12
  },
  "bySource": {
    "onerror": 800,
    "unhandledrejection": 450
  },
  "timeline": [...]
}
```

## Views Created

### error_stats
Hourly error statistics from the last 7 days.

Query: `SELECT * FROM error_stats`

### recent_unresolved_errors
Recent unresolved errors (limited to 50).

Query: `SELECT * FROM recent_unresolved_errors`

## How Notifications Work

When an error is logged:

1. ✅ Error inserted into `error_logs`
2. ✅ Trigger `trigger_notify_admin_on_error` fires
3. ✅ `notify_admin_on_error()` function executes
4. ✅ Notification created in `notifications` table
5. ✅ Link created in `error_log_notifications`
6. ✅ Admin sees notification in UI

### Notification Data Structure
```json
{
  "type": "error_alert",
  "title": "Production Error Detected",
  "message": "[Error message preview]",
  "data": {
    "error_id": "uuid",
    "url": "https://...",
    "source": "onerror",
    "timestamp": 1776113367332
  }
}
```

## Deduplication Logic

To avoid notification spam, similar errors are grouped:

- **Hash Generated From**: First 200 chars of message + first line of stack
- **Time Window**: 24 hours
- **Grouping**: Same error hash = same error occurrence
- **Tracking**: `occurrence_count` incremented, `last_occurrence_at` updated

Example:
- Error 1: "Cannot read property 'x' of undefined" at Line 45
- Error 2: "Cannot read property 'x' of undefined" at Line 45 (same file, 10 mins later)
  - Result: Grouped as 1 error with occurrence_count = 2

## Security

### Row Level Security (RLS)

- ✅ **SELECT**: Only admin can view error logs
- ✅ **INSERT**: Service role can insert (from API)
- ✅ **UPDATE**: Only admin can update/resolve
- ✅ **Queries**: Automatically filtered to admin user

## Monitoring Dashboard Ideas

Create admin dashboard with:

1. **Error Summary**
   - Total errors (all-time)
   - Unresolved errors
   - Unique errors (24h)

2. **Error Timeline**
   - Errors per hour (last 7 days)
   - Trend analysis

3. **Error Sources**
   - Pie chart: onerror vs unhandledrejection
   - Top error messages

4. **Detailed List**
   - Error message
   - Affected URLs
   - User count
   - Last occurrence
   - Resolution status

5. **Drill-Down**
   - Full stack trace
   - Browser info
   - Session/User details
   - Admin notes

## Example Usage

### Getting Unresolved Errors
```sql
SELECT * FROM recent_unresolved_errors;
```

### Resolving an Error
```bash
curl -X PATCH http://localhost:3000/api/admin/error-logs/{error-id} \
  -H "Content-Type: application/json" \
  -d '{"resolved": true, "notes": "Fixed in v1.2.0"}'
```

### Getting Statistics
```bash
curl http://localhost:3000/api/admin/error-logs/stats
```

## Performance Considerations

- **Indexing**: All frequently-searched fields are indexed
- **Pagination**: Required for list endpoints (max 500 per page)
- **Retention**: Consider archiving errors older than 30 days in production
- **Deduplication**: Prevents database bloat from repeated errors

## Future Enhancements

1. **Error Source Maps**: Upload source maps for readable stack traces
2. **Error Replay**: Store session recordings linked to errors
3. **Slack Integration**: Send critical errors to Slack
4. **Threshold Alerts**: Alert when error count exceeds threshold
5. **Pattern Detection**: ML-based error pattern recognition
6. **User Feedback**: Attach user-reported feedback to errors

## Troubleshooting

### Notifications Not Appearing
Check:
1. Admin record exists in `admin` table
2. Admin user ID matches auth.users
3. Trigger is active: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_notify_admin_on_error'`
4. RLS policies allow notifications insert

### Database Permissions
If getting permission errors, run as authenticated admin user:
```sql
GRANT SELECT, INSERT, UPDATE ON error_logs TO authenticated;
GRANT SELECT ON error_stats TO authenticated;
GRANT SELECT ON recent_unresolved_errors TO authenticated;
```
