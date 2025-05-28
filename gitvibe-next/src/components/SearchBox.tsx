'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import debounce from 'lodash/debounce';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export default function SearchBox() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Repository[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Create the actual search function that will be debounced
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      
      // Call our API endpoint that proxies to the backend
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      console.log('Search API response status:', response.status);
      const data = await response.json();
      console.log('Search API response data:', data);
      
      if (!response.ok || data.error) {
        console.error('Search API returned error:', data.error || response.statusText);
        throw new Error(data.error || `Search failed: ${response.status}`);
      }
      
      if (!data.items) {
        console.warn('Search returned unexpected data format:', data);
        throw new Error('Unexpected response format from search API');
      }
      
      // Debug the items we received
      console.log('Raw items from API:', JSON.stringify(data.items));
      
      // Transform the data if needed to match our Repository interface
      const repositories = data.items.map((item: any) => {
        const repo = {
          id: item.id || Math.random(), // Fallback for missing ID
          name: item.name || '',
          full_name: item.full_name || `${item.owner?.login || 'unknown'}/${item.name || 'repo'}`,
          description: item.description || '',
          owner: {
            login: item.owner?.login || 'unknown',
            avatar_url: item.owner?.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
          }
        };
        console.log('Transformed repository:', repo);
        return repo;
      });
      
      console.log(`Found ${repositories.length} search results`);
      
      // Force showing suggestions
      setShowSuggestions(true);
      setSuggestions(repositories);
    } catch (err) {
      // Better error logging with more details
      console.error('Search error details:', { 
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : null,
        errorObject: JSON.stringify(err, Object.getOwnPropertyNames(err || {})) 
      });
      
      setError(err instanceof Error ? err.message : 'Failed to search repositories');
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    try {
      let owner = '';
      let repo = '';
      
      // Handle full GitHub URL
      const urlMatch = query.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (urlMatch) {
        [, owner, repo] = urlMatch;
      } else {
        // Handle owner/repo format
        const parts = query.split('/').filter(Boolean);
        if (parts.length >= 2) {
          [owner, repo] = parts.slice(-2);
        } else {
          throw new Error('Please enter a valid GitHub repository URL or owner/repo');
        }
      }
      
      // Clean up the repo name (remove .git if present and any query parameters)
      repo = repo.replace(/\.git$/, '').split('?')[0];
      
      // Validate owner and repo names
      if (!owner || !repo) {
        throw new Error('Invalid repository format');
      }
      
      // Navigate to the repo page
      router.push(`/repo/${owner}/${repo}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid repository format');
    }
  };

  // Create a debounced version of the search function
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      setIsSearching(true);
      performSearch(searchQuery);
    }, 300),
    []
  );

  // Effect to trigger the debounced search when query changes
  useEffect(() => {
    if (query) {
      debouncedSearch(query);
    } else {
      setSuggestions([]);
    }
    
    // Cleanup function to cancel pending debounced calls when component unmounts
    return () => debouncedSearch.cancel();
  }, [query, debouncedSearch]);

  // Handle clicks outside the suggestions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('SearchBox state update:', { 
      query: query,
      suggestionsCount: suggestions.length,
      showSuggestions: showSuggestions,
      isSearching: isSearching,
      error: error
    });
  }, [query, suggestions, showSuggestions, isSearching, error]);

  return (
    <div className="max-w-2xl mx-auto relative">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex shadow-lg rounded-lg overflow-hidden">
          <div className="relative flex-grow" ref={searchRef}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-[var(--muted-foreground)]" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                // Delay hiding suggestions to allow for clicks on the suggestions
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              placeholder="Enter GitHub repository URL or owner/repo"
              className="block w-full pl-12 pr-4 py-4 text-base border-0 bg-[var(--surface)] text-[var(--foreground)] rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all duration-200"
              aria-label="GitHub repository URL or owner/repo"
            />
            
            {/* Repository Suggestions Dropdown */}
            {(() => {
              console.log('Render conditions:', { queryLength: query.length, showSuggestions, isSearching, hasSuggestions: suggestions.length > 0 });
              return true;
            })() && (
              <div className="absolute z-50 mt-1 w-full bg-[var(--surface)] border border-[var(--muted)] rounded-md shadow-lg max-h-60 overflow-auto" style={{ top: '100%', left: 0, backgroundColor: 'white' }}>
                {isSearching ? (
                  <div className="p-4 text-center text-[var(--muted-foreground)]">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--primary)] mr-2"></div>
                    Searching...
                  </div>
                ) : error ? (
                  <div className="p-4 text-center text-[var(--error)]">
                    {error}
                  </div>
                ) : suggestions.length > 0 ? (
                  <ul className="py-1">
                    {suggestions.map((repo) => (
                      <li 
                        key={repo.id || `repo-${repo.full_name}`}
                        onClick={() => {
                          setQuery(repo.full_name);
                          setSuggestions([]);
                          setShowSuggestions(false);
                          router.push(`/repo/${repo.full_name}`);
                        }}
                        className="px-4 py-2 hover:bg-[var(--muted)]/30 cursor-pointer flex items-center"
                      >
                        <Image
                          src={repo.owner.avatar_url}
                          alt={`${repo.owner.login}'s avatar`}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                        <div>
                          <div className="font-medium text-[var(--foreground)]">{repo.full_name}</div>
                          {repo.description && (
                            <div className="text-xs text-[var(--muted-foreground)] truncate max-w-xs">
                              {repo.description}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-[var(--muted-foreground)]">
                    No repositories found
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            type="submit"
            className="px-8 py-4 bg-[var(--primary)] text-[var(--primary-foreground)] font-medium rounded-r-lg hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
          >
            Analyze
          </button>
        </div>
      </form>
    </div>
  );
}
