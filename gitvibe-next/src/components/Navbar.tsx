'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MarkGithubIcon } from '@primer/octicons-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path 
      ? 'text-[var(--primary)] border-[var(--primary)] font-semibold' 
      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] border-transparent hover:border-[var(--muted)]';
  };

  return (
    <nav className="bg-[var(--surface)] backdrop-blur-sm border-b border-[var(--muted)]/30 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link 
                href="/" 
                className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:scale-105 transition-all duration-300 flex items-center"
              >
                <span className="mr-2 text-2xl">🔍</span>
                GitVibe
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-2 pt-1 border-b-2 ${isActive('/')} transition-all duration-200 text-sm font-medium`}
              >
                Home
              </Link>
              <Link
                href="/compare"
                className={`inline-flex items-center px-2 pt-1 border-b-2 ${isActive('/compare')} transition-all duration-200 text-sm font-medium`}
              >
                Compare
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/username/gitvibe-next"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/20 transition-all duration-200"
              aria-label="GitHub Repository"
            >
              <MarkGithubIcon size={22} />
            </a>
            <div className="border-l border-[var(--muted)]/30 h-6 mx-1"></div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
