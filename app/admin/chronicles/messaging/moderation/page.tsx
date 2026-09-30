'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Loader2,
  Eye,
  X,
} from 'lucide-react';

interface ModerationItem {
  id: string;
  message_id: string;
  conversation_id: string;
  reported_by?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  flag_reason: string;
  additional_notes?: string;
  ai_flagged: boolean;
  ai_confidence?: number;
  ai_reason?: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  reviewed_by?: string;
  reviewed_at?: string;
  review_action?: string;
  review_notes?: string;
  created_at: string;
}

export default function MessagingModerationPage() {
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);

  useEffect(() => {
    fetchModerationQueue();
  }, [statusFilter]);

  const fetchModerationQueue = async () => {
    try {
      setLoading(true);
      // For now, we'll show empty state since the API endpoint needs to be created
      setModerationQueue([]);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (itemId: string, action: string) => {
    try {
      // API call to review the item would go here
      console.log(`Review item ${itemId} with action ${action}`);
      fetchModerationQueue();
    } catch (err) {
      console.error('Failed to review item:', err);
    }
  };

  const filteredQueue = moderationQueue.filter(item =>
    item.flag_reason.toLowerCase().includes(search.toLowerCase()) ||
    (item.additional_notes && item.additional_notes.toLowerCase().includes(search.toLowerCase()))
  );

  const priorityColors = {
    low: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    normal: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    urgent: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold">Message Moderation</h1>
        </div>
        <p className="text-muted-foreground">Review and moderate flagged messages and reports</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search moderation queue..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 bg-white dark:bg-slate-800"
          >
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4 mb-6">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 inline mr-2" />
          {error}
        </div>
      )}

      {/* Moderation Queue */}
      <div className="space-y-4">
        {filteredQueue.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-white dark:bg-slate-900 rounded-lg border">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No items in moderation queue</p>
          </div>
        ) : (
          filteredQueue.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-lg border p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${priorityColors[item.priority]}`}>
                      {item.priority}
                    </span>
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs">
                      {item.flag_reason}
                    </span>
                    {item.ai_flagged && (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs">
                        AI Flagged
                      </span>
                    )}
                  </div>
                  <p className="text-sm mb-2">{item.additional_notes || 'No additional notes'}</p>
                  {item.ai_reason && (
                    <p className="text-xs text-muted-foreground mb-2">
                      AI Reason: {item.ai_reason} (confidence: {item.ai_confidence})
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedItem(item)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReview(item.id, 'approve')}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReview(item.id, 'reject')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
