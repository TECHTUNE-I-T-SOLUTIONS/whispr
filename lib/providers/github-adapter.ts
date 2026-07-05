// GitHub Adapter
// Developer ecosystem provider adapter following docs/V2/ section 9

import { BaseAdapter } from './base-adapter';
import axios from 'axios';

export class GitHubAdapter extends BaseAdapter {
  name = 'github';
  private baseUrl = 'https://api.github.com';
  private token: string | undefined;

  constructor() {
    super();
    this.token = process.env.GITHUB_TOKEN;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Whispr/1.0',
    };

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    return headers;
  }

  async search(query: string, options?: any): Promise<any> {
    const searchUrl = `${this.baseUrl}/search/repositories`;
    const sort = options?.sort || 'stars';
    const order = options?.order || 'desc';
    const perPage = options?.perPage || 10;

    return this.withRetry(async () => {
      const response = await axios.get(searchUrl, {
        params: {
          q: query,
          sort,
          order,
          per_page: perPage,
        },
        headers: this.getHeaders(),
      });

      return {
        items: response.data.items?.map((repo: any) => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          url: repo.html_url,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          created_at: repo.created_at,
          updated_at: repo.updated_at,
          topics: repo.topics || [],
          owner: {
            login: repo.owner.login,
            avatar_url: repo.owner.avatar_url,
          },
        })) || [],
        total_count: response.data.total_count,
      };
    }, 'search');
  }

  async fetch(id: string, options?: any): Promise<any> {
    const repoUrl = `${this.baseUrl}/repos/${id}`;

    return this.withRetry(async () => {
      const response = await axios.get(repoUrl, {
        headers: this.getHeaders(),
      });

      return {
        id: response.data.id,
        name: response.data.name,
        full_name: response.data.full_name,
        description: response.data.description,
        url: response.data.html_url,
        stars: response.data.stargazers_count,
        forks: response.data.forks_count,
        language: response.data.language,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
        topics: response.data.topics || [],
        owner: {
          login: response.data.owner.login,
          avatar_url: response.data.owner.avatar_url,
        },
        license: response.data.license,
        open_issues: response.data.open_issues_count,
        watchers: response.data.watchers_count,
      };
    }, 'fetch');
  }

  async latest(options?: any): Promise<any> {
    // Fetch trending repositories (GitHub doesn't have a direct trending API)
    // We'll use search with date filter
    const date = new Date();
    date.setDate(date.getDate() - 7);
    const dateStr = date.toISOString().split('T')[0];

    const query = `created:>${dateStr} stars:>100`;
    return this.search(query, { sort: 'stars', perPage: 20 });
  }

  async trending(options?: any): Promise<any> {
    // Similar to latest, but with different criteria
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const dateStr = date.toISOString().split('T')[0];

    const query = `created:>${dateStr} stars:>10`;
    return this.search(query, { sort: 'stars', perPage: 20 });
  }

  async details(url: string, options?: any): Promise<any> {
    // Extract owner/repo from URL
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return { error: 'Invalid GitHub URL' };
    }

    const owner = match[1];
    const repo = match[2];
    return this.fetch(`${owner}/${repo}`, options);
  }
}

export const githubAdapter = new GitHubAdapter();
