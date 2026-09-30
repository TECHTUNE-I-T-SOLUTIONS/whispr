'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Shield,
  Users,
  TrendingUp,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export default function AdminMessagingDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    total_conversations: 0,
    total_messages: 0,
    active_restrictions: 0,
    pending_moderation: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // In production, fetch real stats from API
      setStats({
        total_conversations: 0,
        total_messages: 0,
        active_restrictions: 0,
        pending_moderation: 0,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, onClick }: any) => (
    <button
      onClick={onClick}
      className="bg-white dark:bg-slate-900 rounded-lg border p-6 hover:border-red-500 transition-colors text-left w-full"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </button>
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
          <MessageSquare className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold">Messaging Management</h1>
        </div>
        <p className="text-muted-foreground">Monitor and manage chronicles messaging system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={MessageSquare}
          label="Total Conversations"
          value={stats.total_conversations}
          color="bg-gradient-to-br from-red-600 to-red-700"
          onClick={() => router.push('/admin/chronicles/messaging/conversations')}
        />
        <StatCard
          icon={TrendingUp}
          label="Total Messages"
          value={stats.total_messages}
          color="bg-gradient-to-br from-blue-600 to-blue-700"
          onClick={() => router.push('/admin/chronicles/messaging/messages')}
        />
        <StatCard
          icon={Shield}
          label="Active Restrictions"
          value={stats.active_restrictions}
          color="bg-gradient-to-br from-orange-600 to-orange-700"
          onClick={() => router.push('/admin/chronicles/messaging/restrictions')}
        />
        <StatCard
          icon={AlertTriangle}
          label="Pending Moderation"
          value={stats.pending_moderation}
          color="bg-gradient-to-br from-red-600 to-red-700"
          onClick={() => router.push('/admin/chronicles/messaging/moderation')}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => router.push('/admin/chronicles/messaging/restrictions')}
          className="p-6 bg-white dark:bg-slate-900 border rounded-lg hover:border-red-500 transition-colors text-left"
        >
          <Shield className="w-6 h-6 text-red-600 mb-3" />
          <p className="font-semibold">Manage Restrictions</p>
          <p className="text-sm text-muted-foreground">View and manage creator messaging restrictions</p>
        </button>

        <button
          onClick={() => router.push('/admin/chronicles/messaging/moderation')}
          className="p-6 bg-white dark:bg-slate-900 border rounded-lg hover:border-red-500 transition-colors text-left"
        >
          <AlertTriangle className="w-6 h-6 text-orange-600 mb-3" />
          <p className="font-semibold">Moderation Queue</p>
          <p className="text-sm text-muted-foreground">Review flagged messages and reports</p>
        </button>
      </div>
    </div>
  );
}
