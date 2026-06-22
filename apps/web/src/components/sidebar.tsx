'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Columns2Icon,
  MenuIcon,
  PanelLeftClose,
  PanelLeftOpen,
  TrophyIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { usePrefetchLeaderboard } from '@/hooks/use-leaderboard-query';
import { useTranslations } from '@/hooks/use-translations';
import { UserMenu } from './user-menu';

interface NavItem {
  titleKey: 'leaderboard' | 'compare' | 'submit_agent';
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItemsConfig: NavItem[] = [
  {
    titleKey: 'leaderboard',
    href: '/leaderboard',
    icon: TrophyIcon,
  },
  {
    titleKey: 'compare',
    href: '/compare',
    icon: Columns2Icon,
  },
  {
    titleKey: 'submit_agent',
    href: '/submit',
    icon: UploadIcon,
  },
];

interface SidebarProps {
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const t = useTranslations();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  // Track actual browser pathname — usePathname() doesn't update on replaceState
  const [browserPath, setBrowserPath] = React.useState('');
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname triggers re-sync with actual browser path on navigation
  React.useEffect(() => {
    setBrowserPath(window.location.pathname);
  }, [pathname]);

  React.useEffect(() => {
    const handler = () => setBrowserPath(window.location.pathname);
    window.addEventListener('url-replaced', handler);
    return () => window.removeEventListener('url-replaced', handler);
  }, []);

  const { prefetchLeaderboard } = usePrefetchLeaderboard();

  const currentPath = browserPath || pathname;

  const isSettingsPage = currentPath.startsWith('/settings');

  React.useEffect(() => {
    if (isSettingsPage) {
      setCollapsed(true);
    }
  }, [isSettingsPage]);

  const sidebarWidth = collapsed ? 'w-16' : 'w-64';

  const handleNavItemMouseEnter = React.useCallback(
    (href: string) => {
      if (href === '/leaderboard') {
        void prefetchLeaderboard('all');
      }
    },
    [prefetchLeaderboard],
  );

  // JSX variable (not an inline component) so React reconciles instead of remounting on every render
  const sidebarContent = (
    <>
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {collapsed ? (
          <button
            type="button"
            className="flex items-center justify-center w-full h-full hover:bg-sidebar-accent transition-colors rounded-lg"
            onClick={() => setCollapsed(false)}
          >
            <PanelLeftOpen className="h-6 w-6 text-primary" />
          </button>
        ) : (
          <div className="flex items-center gap-2 px-2 py-1.5" />
        )}

        {!collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors lg:flex hidden flex-shrink-0"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-hidden flex flex-col">
        {navItemsConfig.map((item) => {
          const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className="block"
              onMouseEnter={() => handleNavItemMouseEnter(item.href)}
              onClick={() => setMobileOpen(false)}
            >
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative flex items-center gap-3 px-3 py-2 rounded-lg
                  transition-colors apple-transition
                  ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {t(`Sidebar.${item.titleKey}`)}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.badge && !collapsed && (
                  <span className="ml-auto px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                    {item.badge}
                  </span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 mt-auto">
        <UserMenu user={user} collapsed={collapsed} />
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-background rounded-lg border shadow-sm"
        aria-label="Open menu"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="lg:hidden fixed left-0 top-0 h-full w-64 bg-sidebar z-50 flex flex-col sidebar-container"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-sidebar-accent"
                aria-label="Close menu"
              >
                <XIcon className="h-4 w-4" />
              </button>
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className={`hidden lg:flex flex-col h-screen bg-sidebar sidebar-container z-30 ${sidebarWidth}`}
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}
