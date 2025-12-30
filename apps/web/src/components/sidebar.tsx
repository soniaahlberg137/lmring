'use client';

import { ScrollArea, SidebarConversationSkeleton } from '@lmring/ui';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ClockIcon,
  MenuIcon,
  MessageSquareIcon,
  MessageSquarePlusIcon,
  PanelLeftClose,
  PanelLeftOpen,
  SparklesIcon,
  TrophyIcon,
  XIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import { arenaSelectors, useArenaStore, useWorkflowStore, workflowSelectors } from '@/stores';
import { UserMenu } from './user-menu';

interface RecentConversation {
  id: string;
  title: string;
  firstMessage?: string;
  updatedAt: string;
}

interface NavItem {
  titleKey: 'new_chat' | 'leaderboard' | 'history';
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItemsConfig: NavItem[] = [
  {
    titleKey: 'new_chat',
    href: '/arena',
    icon: MessageSquarePlusIcon,
  },
  {
    titleKey: 'leaderboard',
    href: '/leaderboard',
    icon: TrophyIcon,
  },
  {
    titleKey: 'history',
    href: '/history',
    icon: ClockIcon,
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
  const t = useTranslations('Sidebar');
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isLogoHovered, setIsLogoHovered] = React.useState(false);
  const [recentConversations, setRecentConversations] = React.useState<RecentConversation[]>([]);
  const [conversationsLoaded, setConversationsLoaded] = React.useState(false);
  const pathname = usePathname();

  const newConversation = useWorkflowStore(workflowSelectors.newConversation);
  const clearNewConversation = useWorkflowStore((state) => state.clearNewConversation);
  const resetConversation = useWorkflowStore((state) => state.resetConversation);

  const availableModels = useArenaStore(arenaSelectors.availableModels);
  const resetComparisons = useArenaStore((state) => state.resetComparisons);

  const currentPath = pathname;

  const isSettingsPage = currentPath.startsWith('/settings');

  React.useEffect(() => {
    if (isSettingsPage) {
      setCollapsed(true);
    }
  }, [isSettingsPage]);

  React.useEffect(() => {
    const fetchRecentConversations = async () => {
      if (collapsed || conversationsLoaded) return;

      try {
        const response = await fetch('/api/conversations?limit=10&withFirstMessage=true');
        if (response.ok) {
          const data = await response.json();
          setRecentConversations(data.conversations || []);
        }
      } catch (error) {
        console.error('Failed to fetch recent conversations:', error);
      } finally {
        setConversationsLoaded(true);
      }
    };

    fetchRecentConversations();
  }, [collapsed, conversationsLoaded]);

  React.useEffect(() => {
    if (newConversation && conversationsLoaded) {
      const exists = recentConversations.some((conv) => conv.id === newConversation.id);
      if (!exists) {
        setRecentConversations((prev) => [
          {
            id: newConversation.id,
            title: newConversation.title,
            firstMessage: newConversation.title,
            updatedAt: newConversation.updatedAt,
          },
          ...prev.slice(0, 9),
        ]);
      }
      clearNewConversation();
    }
  }, [newConversation, conversationsLoaded, recentConversations, clearNewConversation]);

  const sidebarWidth = collapsed ? 'w-16' : 'w-64';

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
  };

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {collapsed ? (
          <button
            type="button"
            className="flex items-center justify-center w-full h-full hover:bg-sidebar-accent transition-colors rounded-lg"
            onClick={() => setCollapsed(false)}
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
          >
            {isLogoHovered ? (
              <PanelLeftOpen className="h-6 w-6 text-primary" />
            ) : (
              <SparklesIcon className="h-6 w-6 text-primary" />
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <SparklesIcon className="h-6 w-6 text-primary flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-lg font-semibold whitespace-nowrap overflow-hidden text-left"
                >
                  LMRing
                </motion.span>
              )}
            </AnimatePresence>
          </div>
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
          const isNewChat = item.href === '/arena';
          const isActive = isNewChat
            ? currentPath === '/arena'
            : currentPath === item.href || currentPath.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="block">
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (!isNewChat) return;
                  resetConversation();
                  if (availableModels.length > 0) {
                    resetComparisons(availableModels);
                  }
                }}
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
                      {t(item.titleKey)}
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

        {!collapsed && (
          <div className="mt-4">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('today')}
            </div>
            <ScrollArea className="max-h-[300px]">
              {!conversationsLoaded ? (
                <SidebarConversationSkeleton count={5} />
              ) : recentConversations.length > 0 ? (
                <div className="space-y-0.5">
                  {recentConversations.map((conv) => {
                    const isConvActive = currentPath === `/arena/${conv.id}`;
                    const displayText = conv.firstMessage
                      ? truncateText(conv.firstMessage, 20)
                      : truncateText(conv.title, 20);

                    return (
                      <Link key={conv.id} href={`/arena/${conv.id}`} className="block">
                        <motion.div
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                          className={`
                            relative flex items-center gap-2 px-3 py-1.5 rounded-md text-sm
                            transition-colors apple-transition
                            ${
                              isConvActive
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                : 'hover:bg-sidebar-accent/30 text-sidebar-foreground/70'
                            }
                          `}
                        >
                          {isConvActive && (
                            <motion.div
                              layoutId="conversationIndicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            />
                          )}
                          <MessageSquareIcon
                            className={`h-4 w-4 flex-shrink-0 ${isConvActive ? 'text-primary' : 'opacity-60'}`}
                          />
                          <span className="truncate">{displayText}</span>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </ScrollArea>
          </div>
        )}
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
              <SidebarContent />
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
        <SidebarContent />
      </motion.aside>
    </>
  );
}
