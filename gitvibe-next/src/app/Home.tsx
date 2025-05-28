'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { StarIcon } from '@heroicons/react/24/solid';
import { ArrowPathIcon, CodeBracketIcon, EyeIcon } from '@heroicons/react/24/outline';
import SearchBox from '@/components/SearchBox';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

interface Repository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  language: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
}

export default function Home() {
  const [trendingRepos, setTrendingRepos] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch trending repositories from GitHub API
  const fetchTrendingRepos = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      // Add cache-busting parameter
      const timestamp = new Date().getTime();
      const response = await fetch(
        `https://api.github.com/search/repositories?q=stars:>1000&sort=stars&order=desc&per_page=50&_=${timestamp}`, 
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch trending repositories');
      }
      
      const data = await response.json();
      
      // Get 4 random repos from top 50
      const shuffled = [...data.items]
        .sort(() => 0.5 - Math.random())
        .slice(0, 4);
      
      setTrendingRepos(shuffled);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trending repositories. Please try again later.');
      console.error('Error fetching trending repos:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };



  // Initial fetch
  useEffect(() => {
    fetchTrendingRepos();
  }, []);

  // Handle refresh button click
  const handleRefresh = () => {
    fetchTrendingRepos(true);
  };
  


  const handleRepoClick = (fullName: string) => {
    window.location.href = `/repo/${fullName}`;
  };

  const { resolvedTheme } = useTheme();

  return (
    <div className={`min-h-screen ${inter.className}`} style={{ background: 'linear-gradient(to bottom right, var(--background), var(--muted))' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--foreground)] mb-2">GitVibe</h1>
          <p className="mt-4 text-xl text-[var(--muted-foreground)] max-w-3xl mx-auto mb-10">Discover, analyze and get insights about GitHub repositories with beautiful visualizations</p>
          
          <SearchBox />
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-16 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">Trending Repositories</h2>
            <button
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="text-sm bg-[var(--surface)] px-3 py-1.5 rounded-md border border-[var(--muted)] text-[var(--primary)] hover:bg-[var(--muted)]/20 flex items-center space-x-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh repositories"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

        {isLoading && !isRefreshing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[var(--surface)] rounded-lg shadow-md overflow-hidden border border-[var(--muted)] transition-all">
                <div className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-[var(--muted)]/70"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-[var(--muted)]/70 rounded"></div>
                        <div className="h-3 w-24 bg-[var(--muted)]/50 rounded"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-[var(--muted)]/70 rounded"></div>
                      <div className="h-3 bg-[var(--muted)]/50 rounded w-5/6"></div>
                    </div>
                    <div className="flex space-x-4 pt-2">
                      <div className="flex items-center space-x-1">
                        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-3 w-6 bg-gray-100 dark:bg-gray-600 rounded"></div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-3 w-6 bg-gray-100 dark:bg-gray-600 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-[var(--error)]">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-[var(--primary)] hover:text-[var(--primary)]/80"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingRepos.map((repo) => (
              <div
                key={repo.id}
                onClick={() => handleRepoClick(repo.full_name)}
                className="bg-[var(--surface)] rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border border-[var(--muted)] hover:-translate-y-1"
                title={`View ${repo.full_name} analysis`}
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <img 
                      src={repo.owner.avatar_url} 
                      alt={`${repo.owner.login} avatar`} 
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div>
                      <h3 className="font-semibold text-[var(--foreground)] truncate">
                        {repo.name}
                      </h3>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {repo.owner.login}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-[var(--muted-foreground)] text-sm mb-4 line-clamp-2">
                    {repo.description || 'No description provided'}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <StarIcon className="h-4 w-4 mr-1 text-yellow-400" />
                      <span>{repo.stargazers_count.toLocaleString()}</span>
                    </div>
                    {repo.language && (
                      <span className="px-2 py-1 bg-[var(--muted)]/30 rounded-full text-xs text-[var(--foreground)]">
                        {repo.language}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
