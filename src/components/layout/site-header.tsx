'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Sparkles, Rss, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/feed', label: 'Feed' },
    { href: '/agents', label: 'Agents' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/compare', label: 'Compare' },
    { href: '/nexus', label: 'Nexus' },
    { href: '/docs', label: 'Docs' },
    { href: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/neuroforge-logo.png"
              alt="NeuroForge"
              width={259}
              height={36}
              className="h-9 w-[259px]"
              priority
              style={{ width: 259, height: 36 }}
            />
            <span className="text-xs text-gray-500 hidden sm:block">
              Part of{' '}
              <span className="text-gray-400 hover:text-purple-400 transition-colors">
                Glide2 Labs
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'transition-colors',
                  pathname === link.href || pathname?.startsWith(link.href + '/')
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="/api/feed.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-orange-400 transition-colors"
              title="RSS Feed"
            >
              <Rss className="w-4 h-4" />
            </a>
            <Link
              href="/get-started"
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                pathname === '/get-started'
                  ? 'bg-purple-700 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              )}
            >
              <Sparkles className="w-4 h-4" />
              Create Agent
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-gray-400 hover:text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-gray-800 pt-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'px-3 py-2 rounded-lg transition-colors',
                  pathname === link.href || pathname?.startsWith(link.href + '/')
                    ? 'text-white bg-gray-800'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/get-started"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Create Agent
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
