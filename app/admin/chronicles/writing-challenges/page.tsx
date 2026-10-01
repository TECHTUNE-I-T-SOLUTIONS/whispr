'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Plus, MoreVertical, Edit, Eye, Trash2, RefreshCw, Zap, Calendar, Users 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface WritingPrompt {
  id: string;
  title: string;
  description: string;
  prompt_type: 'blog' | 'poem' | 'story';
  challenge_type: 'daily' | 'weekly' | 'monthly';
  status: 'draft' | 'active' | 'ended' | 'archived';
  starts_at: string;
  ends_at?: string;
  submission_deadline: string;
  entries_count: number;
  is_ai_generated: boolean;
  ai_generation_model?: string;
  created_at: string;
}

export default function WritingChallengesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [prompts, setPrompts] = useState<WritingPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/chronicles/writing-prompts');
      if (!response.ok) throw new Error('Failed to fetch prompts');
      const data = await response.json();
      setPrompts(data.prompts || []);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || prompt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getChallengeTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-blue-500';
      case 'weekly': return 'bg-red-500';
      case 'monthly': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const getPromptTypeColor = (type: string) => {
    switch (type) {
      case 'blog': return 'bg-orange-500';
      case 'poem': return 'bg-indigo-500';
      case 'story': return 'bg-teal-500';
      default: return 'bg-gray-500';
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await fetch(`/api/admin/chronicles/writing-prompts/${deleteId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (res.ok) {
        toast({
          title: 'Challenge deleted',
          description: 'The writing challenge has been deleted successfully.',
        });
        loadPrompts();
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to delete',
          description: 'Could not delete the challenge. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred while deleting the challenge.',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Writing Challenges</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage writing prompts and challenges for creators
          </p>
        </div>
        <Link href="/admin/chronicles/writing-challenges/new">
          <Button className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Challenge
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Challenge Overview</CardTitle>
          <CardDescription>
            View and manage all writing challenges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Input
              placeholder="Search challenges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md w-full sm:w-auto"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="ended">Ended</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Mobile: Card Layout */}
          <div className="md:hidden space-y-4">
            {filteredPrompts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No challenges found
              </div>
            ) : (
              filteredPrompts.map((prompt) => (
                <Card key={prompt.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{prompt.title}</h3>
                      <div className="flex gap-2 mt-2">
                        <Badge className={getPromptTypeColor(prompt.prompt_type)}>
                          {prompt.prompt_type}
                        </Badge>
                        <Badge className={getChallengeTypeColor(prompt.challenge_type)}>
                          {prompt.challenge_type}
                        </Badge>
                        <Badge variant={prompt.status === 'active' ? 'default' : 'secondary'}>
                          {prompt.status}
                        </Badge>
                      </div>
                    </div>
                    {prompt.is_ai_generated && (
                      <Badge variant="outline" className="ml-2">
                        <Zap className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-muted-foreground">Entries:</span>
                      <span className="font-medium ml-1">{prompt.entries_count || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Start:</span>
                      <span className="font-medium ml-1">{new Date(prompt.starts_at).toLocaleDateString()}</span>
                    </div>
                    {prompt.ends_at && (
                      <div>
                        <span className="text-muted-foreground">End:</span>
                        <span className="font-medium ml-1">{new Date(prompt.ends_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Link href={`/admin/chronicles/writing-challenges/${prompt.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/admin/chronicles/writing-challenges/${prompt.id}/edit`} className="flex-1">
                      <Button size="sm" className="w-full bg-red-600 hover:bg-red-700">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(prompt.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Desktop: Table Layout */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Challenge</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>AI</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrompts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No challenges found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrompts.map((prompt) => (
                    <TableRow key={prompt.id}>
                      <TableCell className="font-medium">{prompt.title}</TableCell>
                      <TableCell>
                        <Badge className={getPromptTypeColor(prompt.prompt_type)}>
                          {prompt.prompt_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getChallengeTypeColor(prompt.challenge_type)}>
                          {prompt.challenge_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={prompt.status === 'active' ? 'default' : 'secondary'}>
                          {prompt.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{prompt.entries_count || 0}</TableCell>
                      <TableCell>{new Date(prompt.starts_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {prompt.ends_at ? new Date(prompt.ends_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {prompt.is_ai_generated ? (
                          <Badge variant="outline">
                            <Zap className="w-3 h-3 mr-1" />
                            AI
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/chronicles/writing-challenges/${prompt.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/chronicles/writing-challenges/${prompt.id}/edit`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(prompt.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Writing Challenge</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this writing challenge? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
