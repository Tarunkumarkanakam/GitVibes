'use client';

import { useParams, useRouter } from 'next/navigation';
import VibeScoreProgress from '@/components/VibeScoreProgress';
import { useTheme } from '@/context/ThemeContext';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  StarIcon,
  EyeIcon,
  CodeBracketIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  CodeBracketSquareIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
  FireIcon,
  BoltIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowLeftIcon,
  HashtagIcon
} from '@heroicons/react/24/outline';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// Fetch a roast comment from the backend
const fetchRoastComment = async (repo: any, type: 'short' | 'full' = 'short') => {
  try {
    // Calculate days since last update
    const lastUpdated = new Date(repo.updated_at);
    const daysSinceUpdate = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));

    // Prepare the score value
    const score = calculateVibeScore(repo);

    // Call our new roast API endpoint
    const response = await fetch(
      `/api/roast?` + // Remove '/route' from the URL path
      `repo_name=${encodeURIComponent(repo.name)}` +
      `&owner=${encodeURIComponent(repo.owner.login)}` +
      `&vibe=${type === 'full' ? 'detailed' : 'quick'}` +
      `&score=${score}` +
      `&stars=${repo.stargazers_count}` +
      `&issues=${repo.open_issues_count}` +
      `&last_commit_days=${daysSinceUpdate}`
    );

    const data = await response.json();
    console.log('Roast response:', data);

    if (data.status === 'success') {
      return data.roast || 'No roast available.';
    } else {
      throw new Error(data.error || 'Failed to get roast');
    }
  } catch (error) {
    console.error('Error fetching roast:', error);
    return 'Our roast generator is taking a coffee break. Check back later!';
  }
};

// Calculate Vibe Score (0-100)
const calculateVibeScore = (repo: any) => {
  let score = 50; // Base score

  // Add points based on stars (capped at 30 points)
  score += Math.min(30, (repo.stargazers_count / 1000) * 30);

  // Add points for forks (capped at 20 points)
  score += Math.min(20, (repo.forks_count / 100) * 20);

  // Add points for recent activity (last year)
  const lastUpdated = new Date(repo.updated_at);
  const monthsSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24 * 30);
  score += Math.max(0, 20 - (monthsSinceUpdate * 2));

  // Deduct points for open issues (capped at -20)
  score -= Math.min(20, (repo.open_issues_count / 100) * 20);

  // Ensure score is between 0 and 100
  return Math.min(100, Math.max(0, Math.round(score)));
}

export default function RepoPage() {
  const router = useRouter();
  const params = useParams();
  const [repo, setRepo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vibeScore, setVibeScore] = useState<number | null>(null);
  const [roast, setRoast] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [roasting, setRoasting] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === 'dark';


  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Helper functions for Vibe Score display
  const getVibeColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-400';
    if (score >= 60) return 'from-blue-500 to-cyan-400';
    if (score >= 40) return 'from-yellow-500 to-amber-400';
    if (score >= 20) return 'from-orange-500 to-yellow-400';
    return 'from-red-500 to-pink-400';
  };

  const getVibeEmoji = (score: number) => {
    if (score >= 80) return '🔥';
    if (score >= 60) return '✨';
    if (score >= 40) return '😐';
    if (score >= 20) return '😬';
    return '💀';
  };




  // Separate effect for fetching the roast comment - this won't block page rendering
  useEffect(() => {
    const fetchRoastForRepo = async () => {
      if (!repo) return;

      try {
        setRoasting(true);
        const roastComment = await fetchRoastComment(repo, 'short');
        setRoast(roastComment);
      } catch (err) {
        console.error('Error fetching roast:', err);
        // Set a fallback roast message
        setRoast('Our witty AI is taking a break. Check back for a roast later!');
      } finally {
        setRoasting(false);
      }
    };

    if (repo) {
      fetchRoastForRepo();
    }
  }, [repo]); // Only re-run when repo data changes

  // Main effect for fetching repository data
  useEffect(() => {
    const fetchRepo = async () => {
      try {
        setLoading(true);
        setIsTransitioning(true);

        // Add a small delay for smoother transition
        await new Promise(resolve => setTimeout(resolve, 300));

        const response = await fetch(`https://api.github.com/repos/${params.owner}/${params.repo}`);

        if (!response.ok) {
          throw new Error('Repository not found');
        }

        const data = await response.json();
        setRepo(data);

        // Calculate vibe score immediately
        const score = calculateVibeScore(data);
        setVibeScore(score);

        // We don't wait for roast here - it loads separately

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch repository');
      } finally {
        setLoading(false);
        setIsTransitioning(false);
      }
    };

    if (params.owner && params.repo) {
      fetchRepo();
    }

    // Cleanup function
    return () => {
      setRepo(null);
      setVibeScore(null);
      setRoast('');
    };
  }, [params.owner, params.repo]);

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 ${inter.className} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-75 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Analyzing repository vibes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 ${inter.className} flex items-center justify-center`}>
        <div className="text-center p-8 max-w-md mx-auto">
          <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <ExclamationCircleIcon className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Oops!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!repo) return null;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, var(--background), var(--muted))' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12">
        {/* Main Card */}
        <div className="bg-[var(--surface)] rounded-3xl shadow-xl overflow-hidden border border-[var(--muted)]/30 backdrop-blur-sm">
          <div className="p-8 md:p-12">
            {/* Header: Repo Name & GitHub Link */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--foreground)] flex items-center gap-2">
                  <span>{repo.owner.login}</span>
                  <span className="text-[var(--muted-foreground)]">/</span>
                  <span>{repo.name}</span>
                </h1>
                <p className="mt-2 text-[var(--muted-foreground)] text-lg max-w-2xl">
                  {repo.description || 'No description provided'}
                </p>
              </div>
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-5 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-all font-semibold shadow-md"
              >
                <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" />
                View on GitHub
              </a>
            </div>


            {/* Vibe Score Card */}
            <div className="mt-12 space-y-6">
              <div className="col-span-1 flex flex-col justify-center items-center rounded-2xl shadow-lg p-8 border border-[var(--muted)]/50 backdrop-blur-sm" style={{ background: resolvedTheme === 'dark' ? 'linear-gradient(to bottom right, rgba(30, 58, 138, 0.3), rgba(23, 37, 84, 0.6))' : 'linear-gradient(to bottom right, #EFF6FF, #DBEAFE)' }}>

                <div className="relative mb-2">

                  <div className="absolute inset-0 rounded-full blur-xl" style={{ background: resolvedTheme === 'dark' ? 'radial-gradient(circle, rgba(96, 165, 250, 0.2), rgba(91, 33, 182, 0.1))' : 'radial-gradient(circle, rgba(59, 130, 246, 0.3), rgba(124, 58, 237, 0.2))' }}></div>

                  <span className={`relative text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${getVibeColor(vibeScore ?? 0)}`}>
                    {vibeScore !== null ? vibeScore : '--'}
                  </span>
                </div>
                <span className="text-lg text-[var(--foreground)] font-semibold mt-2 flex items-center gap-2">
                  Vibe Score {vibeScore !== null && <span className="text-2xl">{getVibeEmoji(vibeScore)}</span>}
                </span>
                <VibeScoreProgress score={vibeScore || 0} />
                <div className="mt-6 mb-2 text-center text-[var(--foreground)] text-base w-full">
                  <div className="italic text-[var(--muted-foreground)] mb-3 p-3 rounded-lg border border-[var(--muted)]/30 shadow-inner min-h-[60px] flex items-center justify-center" style={{ background: resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)' }}>
                    "{roast || 'Analyzing repository vibes...'}"
                  </div>
                  <button
                    onClick={async () => {
                      if (!roasting && repo) {
                        setRoasting(true);
                        const fullRoast = await fetchRoastComment(repo, 'full');
                        setRoast(fullRoast);
                        setRoasting(false);
                      }
                    }}
                    disabled={roasting}
                    className="mt-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-[var(--primary-foreground)] font-medium hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm w-full"
                  >
                    {roasting ? 'Roasting...' : 'Roast it!'}
                  </button>
                </div>
              </div>
              <div className='mb-2'></div>
            </div>



            {/* Second row: Repository Stats */}
            <div className="mb-6">
              <div className="bg-[var(--surface)]/90 rounded-2xl p-6 border border-[var(--muted)]/50 shadow-md hover:shadow-lg transition-shadow">
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center">
                  <ChartBarIcon className="w-5 h-5 mr-2 text-[var(--primary)]" /> Repository Stats
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Stars */}
                  <div className="bg-[var(--muted)]/10 rounded-lg p-4 text-center">
                    <StarIcon className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                    <div className="text-2xl font-bold text-[var(--foreground)]">{repo.stargazers_count.toLocaleString()}</div>
                    <div className="text-sm text-[var(--muted-foreground)]">Stars</div>
                  </div>
                  {/* Forks */}
                  <div className="bg-[var(--muted)]/10 rounded-lg p-4 text-center">
                    <CodeBracketIcon className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold text-[var(--foreground)]">{repo.forks_count.toLocaleString()}</div>
                    <div className="text-sm text-[var(--muted-foreground)]">Forks</div>
                  </div>
                  {/* Watchers */}
                  <div className="bg-[var(--muted)]/10 rounded-lg p-4 text-center">
                    <EyeIcon className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                    <div className="text-2xl font-bold text-[var(--foreground)]">{repo.watchers_count.toLocaleString()}</div>
                    <div className="text-sm text-[var(--muted-foreground)]">Watchers</div>
                  </div>
                  {/* Issues */}
                  <div className="bg-[var(--muted)]/10 rounded-lg p-4 text-center">
                    <ExclamationCircleIcon className="w-6 h-6 mx-auto mb-2 text-red-500" />
                    <div className="text-2xl font-bold text-[var(--foreground)]">{repo.open_issues_count.toLocaleString()}</div>
                    <div className="text-sm text-[var(--muted-foreground)]">Issues</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Repository Info Section */}
            <div className="bg-[var(--surface)]/90 rounded-2xl p-6 border border-[var(--muted)]/50 shadow-md hover:shadow-lg transition-shadow">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center">
                <CodeBracketSquareIcon className="w-5 h-5 mr-2 text-[var(--primary)]" /> Repository Info
              </h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-[var(--muted-foreground)] mr-2">📝</span>
                  <span className="text-[var(--foreground)]">Description: {repo.description || 'No description provided.'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-[var(--muted-foreground)] mr-2">👥</span>
                  <span className="text-[var(--foreground)]">Owner: {repo.owner.login}</span>
                </div>
                {repo.language && (
                  <div className="flex items-center">
                    <span className="text-[var(--muted-foreground)] mr-2">💻</span>
                    <span className="text-[var(--foreground)]">Language: {repo.language}</span>
                  </div>
                )}
                {repo.license && (
                  <div className="flex items-center">
                    <span className="text-[var(--muted-foreground)] mr-2">📜</span>
                    <span className="text-[var(--foreground)]">License: {repo.license.name}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="text-[var(--muted-foreground)] mr-2">📅</span>
                  <span className="text-[var(--foreground)]">Created: {formatDate(repo.created_at)}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-[var(--muted-foreground)] mr-2">🔄</span>
                  <span className="text-[var(--foreground)]">Last updated: {formatDate(repo.updated_at)}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-[var(--muted-foreground)] mr-2">💾</span>
                  <span className="text-[var(--foreground)]">Size: {Math.round(repo.size / 1024 * 10) / 10} MB</span>
                </div>
              </div>
            </div>

            {/* Links Section */}
            <div className="bg-[var(--surface)]/90 rounded-2xl p-6 border border-[var(--muted)]/50 shadow-md hover:shadow-lg transition-shadow">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center">
                <ArrowTopRightOnSquareIcon className="w-5 h-5 mr-2 text-[var(--primary)]" /> Links
              </h2>
              <div className="space-y-3">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ArrowTopRightOnSquareIcon className="w-5 h-5 mr-2" />
                  View on GitHub
                </a>
                {repo.homepage && (
                  <a
                    href={repo.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <BoltIcon className="w-5 h-5 mr-2" />
                    Visit Website
                  </a>
                )}
                <a
                  href={`${repo.html_url}/issues`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExclamationCircleIcon className="w-5 h-5 mr-2" />
                  View Issues
                </a>
                <a
                  href={`${repo.html_url}/pulls`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ArrowPathIcon className="w-5 h-5 mr-2" />
                  View Pull Requests
                </a>
              </div>
            </div>

            {/* Topics Section */}
            {repo.topics && repo.topics.length > 0 && (
              <div className="bg-[var(--surface)]/90 rounded-2xl p-6 border border-[var(--muted)]/50 shadow-md hover:shadow-lg transition-shadow">
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center">
                  <HashtagIcon className="w-5 h-5 mr-2 text-[var(--primary)]" /> Topics
                </h2>
                <div className="flex flex-wrap gap-2">
                  {repo.topics.map((topic: string) => (
                    <span
                      key={topic}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
