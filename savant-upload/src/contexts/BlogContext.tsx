import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useStore } from '../store/useStore';
import { useAuth } from './AuthContext';

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  slug: string;
  authorId: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface BlogContextType {
  posts: BlogPost[];
  loading: boolean;
  error: Error | null;
  addPost: (title: string, content: string, status: 'draft' | 'published') => Promise<void>;
  updatePost: (id: string, title: string, content: string, status: 'draft' | 'published') => Promise<void>;
  deletePost: (id: string) => Promise<void>;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export const BlogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const addLog = useStore(state => state.addLog);
  const { user, isAdmin } = useAuth();

  const { data: posts = [], isLoading: loading, error } = useQuery<BlogPost[]>({
    queryKey: ['posts', isAdmin],
    queryFn: async () => {
      const url = isAdmin ? `/api/posts` : `/api/posts?status=published`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error('NETWORK_LATTICE_FAILURE');
      const data = await res.json();
      return data.map((p: any) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        slug: p.slug,
        authorId: p.author_id,
        status: p.status,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        publishedAt: p.published_at
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 10000, // Poll every 10s
  });

  const addMutation = useMutation({
    mutationFn: async (newPost: any) => {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(newPost),
      });
      if (!res.ok) throw new Error('POST_CREATION_FAILURE');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('NODE_INITIALIZED');
      addLog('New post node initialized in lattice', 'INFO');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, post }: { id: string; post: any }) => {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(post),
      });
      if (!res.ok) throw new Error('POST_UPDATE_FAILURE');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('NODE_RECONFIGURED');
      addLog('Post node reconfigured', 'INFO');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/posts/${id}`, { 
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error('POST_DELETION_FAILURE');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('NODE_TERMINATED');
      addLog('Post node terminated from lattice', 'WARN');
    },
  });

  const addPost = async (title: string, content: string, status: 'draft' | 'published') => {
    if (!user || !isAdmin) return;
    try {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 8);
      await addMutation.mutateAsync({
        title,
        content,
        slug,
        author_id: user.id,
        status,
        published_at: status === 'published' ? new Date().toISOString() : null
      });
    } catch (error) {
      console.error('Failed to add post:', error);
    }
  };

  const updatePost = async (id: string, title: string, content: string, status: 'draft' | 'published') => {
    if (!user || !isAdmin) return;
    try {
      await updateMutation.mutateAsync({ id, post: { title, content, status } });
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  };

  const deletePost = async (id: string) => {
    if (!user || !isAdmin) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  return (
    <BlogContext.Provider value={{ 
      posts, 
      loading, 
      error: error as Error,
      addPost,
      updatePost,
      deletePost
    }}>
      {children}
    </BlogContext.Provider>
  );
};

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (context === undefined) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
};
