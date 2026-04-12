'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  AlertCircle,
  CheckCircle,
  Clock,
  Flame,
  TrendingUp,
  MessageSquare,
  Flag,
  DollarSign,
  Users,
  Zap,
  RefreshCw,
  Filter,
  X,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AdminNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  read: boolean;
  read_at?: string;
  action_taken?: string;
  creator_id?: string;
  post_id?: string;
  comment_id?: string;
  data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface CreatorInfo {
  pen_name: string;
  profile_image_url?: string;
}

interface PostInfo {
  title: string;
  slug: string;
}

interface FilterOptions {
  unread_only: boolean;
  priority?: string;
  type?: string;
  search?: string;
}

const notificationIcons = {
  creator_signup: <Users className="w-4 h-4" />,
  creator_milestone: <TrendingUp className="w-4 h-4" />,
  post_viral: <Flame className="w-4 h-4" />,
  post_reported: <Flag className="w-4 h-4" />,
  comment_flagged: <AlertCircle className="w-4 h-4" />,
  high_engagement: <MessageSquare className="w-4 h-4" />,
  low_quality_post: <AlertCircle className="w-4 h-4" />,
  creator_banned: <X className="w-4 h-4" />,
  revenue_milestone: <DollarSign className="w-4 h-4" />,
  subscriber_milestone: <TrendingUp className="w-4 h-4" />,
  admin_action_needed: <Zap className="w-4 h-4" />,
  system_alert: <AlertCircle className="w-4 h-4" />,
};

const priorityColors = {
  critical: 'bg-red-100 border-red-300 text-red-900',
  high: 'bg-orange-100 border-orange-300 text-orange-900',
  normal: 'bg-blue-100 border-blue-300 text-blue-900',
  low: 'bg-gray-100 border-gray-300 text-gray-900',
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [creatorInfo, setCreatorInfo] = useState<Record<string, CreatorInfo>>({});
  const [postInfo, setPostInfo] = useState<Record<string, PostInfo>>({});

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    unread_only: true,
    priority: '',
    type: '',
    search: '',
  });

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [filters]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.unread_only) params.append('unread_only', 'true');
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.type) params.append('type', filters.type);
      params.append('limit', '100');

      const res = await fetch(`/api/chronicles/admin/notifications?${params}`);
      if (!res.ok) throw new Error('Failed to fetch notifications');

      const data = await res.json();
      setNotifications(data.notifications || []);
      setError('');

      // Fetch creator info for notifications
      const creatorIds = new Set(
        data.notifications
          .filter((n: AdminNotification) => n.creator_id)
          .map((n: AdminNotification) => n.creator_id)
      );

      for (const creatorId of creatorIds) {
        if (!creatorInfo[creatorId]) {
          try {
            const creatorRes = await fetch(`/api/chronicles/creator/${creatorId}`);
            if (creatorRes.ok) {
              const creatorData = await creatorRes.json();
              setCreatorInfo((prev) => ({
                ...prev,
                [creatorId]: creatorData,
              }));
            }
          } catch (err) {
            console.error(`Failed to fetch creator ${creatorId}:`, err);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const res = await fetch('/api/chronicles/admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification_id: notificationId,
          action_taken: 'reviewed',
        }),
      });

      if (!res.ok) throw new Error('Failed to mark as read');

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, read: true, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleBulkMarkAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter((n) => !n.read)
        .map((n) => n.id);

      if (unreadIds.length === 0) return;

      const res = await fetch('/api/chronicles/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_ids: unreadIds }),
      });

      if (!res.ok) throw new Error('Failed to mark as read');

      setNotifications((prev) =>
        prev.map((n) =>
          !n.read
            ? { ...n, read: true, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = notifications.filter((n) => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        n.title.toLowerCase().includes(search) ||
        n.message.toLowerCase().includes(search)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Notifications</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshing(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkMarkAsRead}
              >
                Mark All as Read ({unreadCount})
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-black border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">Total</div>
            <div className="text-2xl font-bold text-blue-900">{notifications.length}</div>
          </div>
          <div className="bg-red-50 dark:bg-black border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-600 font-medium">Unread</div>
            <div className="text-2xl font-bold text-red-900">{unreadCount}</div>
          </div>
          <div className="bg-orange-50 dark:bg-black border border-orange-200 rounded-lg p-4">
            <div className="text-sm text-orange-600 font-medium">Critical</div>
            <div className="text-2xl font-bold text-orange-900">
              {notifications.filter((n) => n.priority === 'critical').length}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-black border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium">Actioned</div>
            <div className="text-2xl font-bold text-green-900">
              {notifications.filter((n) => n.action_taken).length}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-black border border-red-200 rounded-lg p-4 mb-4">
          <AlertCircle className="w-4 h-4 text-red-600 inline mr-2" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-black border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) =>
                setFilters({ ...filters, priority: e.target.value })
              }
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">All Types</option>
              <option value="creator_signup">Creator Signup</option>
              <option value="creator_milestone">Milestone</option>
              <option value="post_viral">Viral Post</option>
              <option value="comment_flagged">Flagged Comment</option>
              <option value="high_engagement">High Engagement</option>
              <option value="revenue_milestone">Revenue</option>
              <option value="post_reported">Reported</option>
              <option value="admin_action_needed">Action Needed</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Show</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.unread_only}
                onChange={(e) =>
                  setFilters({ ...filters, unread_only: e.target.checked })
                }
              />
              <span className="text-sm">Unread Only</span>
            </label>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Search</label>
            <Input
              type="text"
              placeholder="Search notifications..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-200">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No notifications</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                priorityColors[notification.priority]
              } ${notification.read ? 'opacity-60' : ''}`}
              onClick={() =>
                setExpandedId(
                  expandedId === notification.id ? null : notification.id
                )
              }
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {notificationIcons[notification.notification_type as keyof typeof notificationIcons] || (
                    <Bell className="w-4 h-4" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-grow">
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{notification.title}</h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-red-500 dark:bg-red-800 rounded-full" />
                        )}
                        <span className="text-xs opacity-70">
                          {notification.notification_type}
                        </span>
                      </div>
                      <p className="text-sm opacity-90 mb-2">{notification.message}</p>

                      {/* Creator Info */}
                      {notification.creator_id &&
                        creatorInfo[notification.creator_id] && (
                          <div className="text-xs opacity-75 mb-2">
                            Creator:{' '}
                            <span className="font-medium">
                              {creatorInfo[notification.creator_id].pen_name}
                            </span>
                          </div>
                        )}

                      {/* Timestamp */}
                      <div className="flex items-center gap-4 text-xs opacity-70">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                        {notification.read_at && (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            Read:{' '}
                            {new Date(notification.read_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    <Button
                      variant={notification.read ? 'outline' : 'default'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className="flex-shrink-0"
                    >
                      {notification.read ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Read
                        </>
                      ) : (
                        'Mark as Read'
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expand */}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    expandedId === notification.id ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {/* Expanded Details */}
              {expandedId === notification.id && (
                <div className="mt-4 pt-4 border-t border-current opacity-50 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="font-semibold mb-1">Full Message</div>
                      <p>{notification.message}</p>
                    </div>
                    {notification.action_taken && (
                      <div>
                        <div className="font-semibold mb-1">Action Taken</div>
                        <p>{notification.action_taken}</p>
                      </div>
                    )}
                    {notification.data && (
                      <div className="col-span-2">
                        <div className="font-semibold mb-1">Additional Data</div>
                        <pre className="bg-black/10 p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(notification.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
