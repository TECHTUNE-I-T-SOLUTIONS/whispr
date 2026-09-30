'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Trophy, Medal, Award, TrendingUp, Users, Crown } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  creator_id: string;
  pen_name: string;
  profile_image_url?: string;
  total_wins: number;
  first_place_wins: number;
  second_place_wins: number;
  third_place_wins: number;
  total_points_earned: number;
  best_rank_achievement: number;
  last_win_at?: string;
}

export default function ChallengeLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/chronicles/challenge-leaderboard');
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1: return <Medal className="w-5 h-5 text-gray-400" />;
      case 2: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">{index + 1}</span>;
    }
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0: return (
        <Badge className="bg-yellow-500">
          <Crown className="w-3 h-3 mr-1" />
          1st
        </Badge>
      );
      case 1: return (
        <Badge className="bg-gray-400">
          <Medal className="w-3 h-3 mr-1" />
          2nd
        </Badge>
      );
      case 2: return (
        <Badge className="bg-amber-600">
          <Award className="w-3 h-3 mr-1" />
          3rd
        </Badge>
      );
      default: return (
        <Badge variant="outline">#{index + 1}</Badge>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Challenge Leaderboard</h1>
        <p className="text-muted-foreground mt-1">
          Top creators based on challenge wins and achievements
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Winners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaderboard.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wins</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaderboard.reduce((sum, entry) => sum + entry.total_wins, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaderboard.reduce((sum, entry) => sum + entry.total_points_earned, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All-Time Leaderboard</CardTitle>
          <CardDescription>
            Rankings based on total wins, placement, and points earned
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile: Card layout */}
          <div className="md:hidden space-y-4">
            {leaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No leaderboard entries yet
              </div>
            ) : (
              leaderboard.map((entry, index) => (
                <Card key={entry.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    {getRankBadge(index)}
                    <div className="flex items-center gap-3">
                      {entry.profile_image_url && (
                        <img
                          src={entry.profile_image_url}
                          alt={entry.pen_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <span className="font-medium">{entry.pen_name}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Wins:</span>
                      <Badge variant="secondary" className="ml-1">{entry.total_wins}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Points:</span>
                      <span className="font-medium ml-1">{entry.total_points_earned}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">1st Place:</span>
                      <Badge className="bg-yellow-500 ml-1">{entry.first_place_wins}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">2nd Place:</span>
                      <Badge className="bg-gray-400 ml-1">{entry.second_place_wins}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">3rd Place:</span>
                      <Badge className="bg-amber-600 ml-1">{entry.third_place_wins}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Best:</span>
                      <Badge variant="outline" className="ml-1">{entry.best_rank_achievement}</Badge>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Last win: {entry.last_win_at ? new Date(entry.last_win_at).toLocaleDateString() : 'Never'}
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Desktop: Table layout */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Total Wins</TableHead>
                  <TableHead>1st Place</TableHead>
                  <TableHead>2nd Place</TableHead>
                  <TableHead>3rd Place</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Best Achievement</TableHead>
                  <TableHead>Last Win</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No leaderboard entries yet
                    </TableCell>
                  </TableRow>
                ) : (
                  leaderboard.map((entry, index) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {getRankIcon(index)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {entry.profile_image_url && (
                            <img
                              src={entry.profile_image_url}
                              alt={entry.pen_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <span className="font-medium">{entry.pen_name}</span>
                        </div>
                      </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entry.total_wins}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-500">{entry.first_place_wins}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-gray-400">{entry.second_place_wins}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-amber-600">{entry.third_place_wins}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.total_points_earned}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.best_rank_achievement}</Badge>
                    </TableCell>
                    <TableCell>
                      {entry.last_win_at ? new Date(entry.last_win_at).toLocaleDateString() : 'Never'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
