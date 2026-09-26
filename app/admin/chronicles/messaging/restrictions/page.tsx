'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Shield,
  Ban,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Loader2,
  UserPlus,
} from 'lucide-react';

interface Restriction {
  id: string;
  creator_id: string;
  restriction_type: 'temporary' | 'permanent' | 'warning';
  reason: string;
  can_send_messages: boolean;
  can_receive_messages: boolean;
  can_send_attachments: boolean;
  can_create_conversations: boolean;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  lifted_at: string | null;
  lift_reason: string | null;
  created_at: string;
  creator: {
    id: string;
    pen_name: string;
    profile_image_url?: string;
  };
}

export default function MessagingRestrictionsPage() {
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchRestrictions();
  }, [statusFilter]);

  const fetchRestrictions = async () => {
    try {
      setLoading(true);
      const status = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
      const res = await fetch(`/api/admin/chronicles/messaging/restrictions${status}`);
      
      if (!res.ok) throw new Error('Failed to fetch restrictions');
      
      const data = await res.json();
      setRestrictions(data.restrictions || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restrictions');
    } finally {
      setLoading(false);
    }
  };

  const handleLiftRestriction = async (restrictionId: string) => {
    if (!confirm('Are you sure you want to lift this restriction?')) return;

    try {
      const res = await fetch(`/api/admin/chronicles/messaging/restrictions/${restrictionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'lift' }),
      });

      if (!res.ok) throw new Error('Failed to lift restriction');

      fetchRestrictions();
    } catch (err) {
      console.error('Failed to lift restriction:', err);
    }
  };

  const filteredRestrictions = restrictions.filter(restriction =>
    restriction.creator.pen_name.toLowerCase().includes(search.toLowerCase()) ||
    restriction.reason.toLowerCase().includes(search.toLowerCase())
  );

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
          <Shield className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold">Messaging Restrictions</h1>
        </div>
        <p className="text-muted-foreground">Manage creator messaging permissions and restrictions</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search restrictions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 bg-white dark:bg-slate-800"
          >
            <option value="all">All Restrictions</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
          <Button onClick={() => setShowCreateModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            New Restriction
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4 mb-6">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 inline mr-2" />
          {error}
        </div>
      )}

      {/* Restrictions List */}
      <div className="space-y-4">
        {filteredRestrictions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-white dark:bg-slate-900 rounded-lg border">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No restrictions found</p>
          </div>
        ) : (
          filteredRestrictions.map((restriction) => (
            <div
              key={restriction.id}
              className={`bg-white dark:bg-slate-900 rounded-lg border p-6 ${
                restriction.is_active ? 'border-orange-200 dark:border-orange-900/30' : 'border-gray-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {restriction.creator.profile_image_url ? (
                      <img
                        src={restriction.creator.profile_image_url}
                        alt={restriction.creator.pen_name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      restriction.creator.pen_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{restriction.creator.pen_name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        restriction.restriction_type === 'permanent' 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : restriction.restriction_type === 'temporary'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}>
                        {restriction.restriction_type}
                      </span>
                      {restriction.is_active ? (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                          Expired
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{restriction.reason}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={!restriction.can_send_messages ? 'text-red-600' : 'text-green-600'}>
                        {restriction.can_send_messages ? '✓' : '✗'} Send Messages
                      </span>
                      <span className={!restriction.can_receive_messages ? 'text-red-600' : 'text-green-600'}>
                        {restriction.can_receive_messages ? '✓' : '✗'} Receive Messages
                      </span>
                      <span className={!restriction.can_send_attachments ? 'text-red-600' : 'text-green-600'}>
                        {restriction.can_send_attachments ? '✓' : '✗'} Send Attachments
                      </span>
                      <span className={!restriction.can_create_conversations ? 'text-red-600' : 'text-green-600'}>
                        {restriction.can_create_conversations ? '✓' : '✗'} Create Conversations
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {restriction.ends_at ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires: {new Date(restriction.ends_at).toLocaleString()}
                        </span>
                      ) : (
                        <span>Permanent restriction</span>
                      )}
                    </div>
                  </div>
                </div>
                {restriction.is_active && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLiftRestriction(restriction.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Lift
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
