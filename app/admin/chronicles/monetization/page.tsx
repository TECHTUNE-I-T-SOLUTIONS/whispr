'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Monetization {
  id: string;
  creator_id: string;
  enrolled: boolean;
  program_status: 'inactive' | 'active' | 'suspended' | 'approved';
  revenue_share_percent: number;
  ad_consent: boolean;
  payment_method?: string;
  total_earned: number;
  pending_balance: number;
  last_payout_date?: string;
  created_at: string;
  updated_at: string;
  creator?: {
    pen_name: string;
    profile_image_url?: string;
  };
}

interface Transaction {
  id: string;
  creator_id: string;
  transaction_type: 'ad_revenue' | 'tip' | 'subscription' | 'payout' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  reference_id?: string;
  completed_at?: string;
  created_at: string;
}

interface FilterOptions {
  status: string;
  sort: string;
  search: string;
}

const statusColors = {
  active: 'bg-green-50 border-green-200 text-green-900',
  inactive: 'bg-gray-50 border-gray-200 text-gray-900',
  suspended: 'bg-red-50 border-red-200 text-red-900',
  approved: 'bg-blue-50 border-blue-200 text-blue-900',
};

const transactionTypeIcons = {
  ad_revenue: <TrendingUp className="w-4 h-4 text-green-600" />,
  tip: <DollarSign className="w-4 h-4 text-blue-600" />,
  subscription: <CheckCircle className="w-4 h-4 text-purple-600" />,
  payout: <ArrowDownLeft className="w-4 h-4 text-orange-600" />,
  refund: <ArrowUpRight className="w-4 h-4 text-red-600" />,
};

export default function AdminMonetizationPage() {
  const [monetizations, setMonetizations] = useState<Monetization[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterOptions>({
    status: 'active',
    sort: 'recent',
    search: '',
  });

  useEffect(() => {
    fetchMonetizations();
    const interval = setInterval(fetchMonetizations, 60000);
    return () => clearInterval(interval);
  }, [filters]);

  const fetchMonetizations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      params.append('limit', '100');

      // This would be a new endpoint to get all monetizations (admin view)
      const res = await fetch(`/api/chronicles/admin/monetization?${params}`);
      if (!res.ok && res.status !== 404) {
        // Fallback if endpoint doesn't exist
        throw new Error('Failed to fetch monetizations');
      }

      const data = await res.json();
      let items = data.monetizations || data || [];

      // Filter by search
      if (filters.search) {
        const search = filters.search.toLowerCase();
        items = items.filter(
          (m: Monetization) =>
            m.creator?.pen_name.toLowerCase().includes(search) ||
            m.creator_id.includes(search)
        );
      }

      // Sort
      if (filters.sort === 'earnings') {
        items.sort((a: Monetization, b: Monetization) => b.total_earned - a.total_earned);
      } else if (filters.sort === 'recent') {
        items.sort(
          (a: Monetization, b: Monetization) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

      setMonetizations(items);
      setError('');
    } catch (err) {
      console.error('Failed to fetch monetizations:', err);
      // Set empty array if endpoint doesn't exist yet
      setMonetizations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCreator = async (creatorId: string) => {
    try {
      setSelectedCreator(creatorId);

      // Fetch transactions for this creator
      const res = await fetch(
        `/api/chronicles/admin/monetization?creator_id=${creatorId}&include_transactions=true`
      );
      if (!res.ok) throw new Error('Failed to fetch transactions');

      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setTransactions([]);
    }
  };

  // Calculate totals
  const totalEarnings = monetizations.reduce((sum, m) => sum + m.total_earned, 0);
  const totalPending = monetizations.reduce((sum, m) => sum + m.pending_balance, 0);
  const activeCreators = monetizations.filter((m) => m.program_status === 'active').length;
  const totalTransactions = transactions.length;

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
        <div className="flex items-center gap-3 mb-6">
          <DollarSign className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold">Monetization Tracking</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium">Total Earnings</div>
            <div className="text-2xl font-bold text-green-900">
              ${totalEarnings.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-sm text-orange-600 font-medium">Pending Payout</div>
            <div className="text-2xl font-bold text-orange-900">
              ${totalPending.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">Active Creators</div>
            <div className="text-2xl font-bold text-blue-900">{activeCreators}</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-sm text-purple-600 font-medium">Total Creators</div>
            <div className="text-2xl font-bold text-purple-900">
              {monetizations.length}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <AlertCircle className="w-4 h-4 text-red-600 inline mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Monetizations List */}
        <div className="col-span-2">
          {/* Filters */}
          <div className="bg-white border rounded-lg p-4 mb-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <select
                  title="Filter status"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="approved">Approved</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Sort</label>
                <select
                  title="Sort by"
                  value={filters.sort}
                  onChange={(e) =>
                    setFilters({ ...filters, sort: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="recent">Recent</option>
                  <option value="earnings">Highest Earnings</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input
                  type="text"
                  placeholder="Search creators..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Creators List */}
          <div className="space-y-3">
            {monetizations.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white border rounded-lg">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No monetized creators yet</p>
              </div>
            ) : (
              monetizations.map((monetization) => (
                <div
                  key={monetization.id}
                  onClick={() => handleSelectCreator(monetization.creator_id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    statusColors[monetization.program_status]
                  } ${
                    selectedCreator === monetization.creator_id
                      ? 'ring-2 ring-primary'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        {monetization.creator?.profile_image_url && (
                          <img
                            src={monetization.creator.profile_image_url}
                            alt={monetization.creator.pen_name}
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                        <div>
                          <div className="font-semibold">
                            {monetization.creator?.pen_name || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {monetization.program_status}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-xs opacity-75">Total Earned</div>
                          <div className="font-semibold">
                            ${monetization.total_earned.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs opacity-75">Pending</div>
                          <div className="font-semibold">
                            ${monetization.pending_balance.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs opacity-75">Revenue Share</div>
                          <div className="font-semibold">
                            {monetization.revenue_share_percent}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs opacity-75">Payment Method</div>
                          <div className="font-semibold">
                            {monetization.payment_method || 'Not Set'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transactions Detail */}
        <div>
          {selectedCreator ? (
            <div className="bg-white border rounded-lg p-4 sticky top-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Recent Transactions
              </h3>

              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No transactions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((tx) => (
                    <div
                      key={tx.id}
                      className="border rounded p-3 text-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {transactionTypeIcons[tx.transaction_type]}
                          <span className="capitalize font-medium">
                            {tx.transaction_type.replace('_', ' ')}
                          </span>
                        </div>
                        <span className={`font-semibold ${
                          tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {tx.amount > 0 ? '+' : ''} ${tx.amount.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs opacity-75">
                        <span className="capitalize">{tx.status}</span>
                        <span>
                          {new Date(tx.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed rounded-lg p-4 text-center text-gray-500">
              <User className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Select a creator to view transactions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
