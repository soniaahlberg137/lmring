'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@lmring/ui';
import { LayoutDashboardIcon, LogOutIcon, SettingsIcon, UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/hooks/use-translations';
import { authClient } from '@/libs/AuthClient';
import { useArenaStore, useWorkflowStore } from '@/stores';

interface UserMenuProps {
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
  collapsed?: boolean;
}

export function UserMenu({ user, collapsed = false }: UserMenuProps) {
  const t = useTranslations();
  const router = useRouter();
  const resetConversation = useWorkflowStore((state) => state.resetConversation);
  const setModelsLastLoadedAt = useArenaStore((state) => state.setModelsLastLoadedAt);

  const handleGoToArena = () => {
    resetConversation();
    setModelsLastLoadedAt(null);
    router.push('/arena');
  };

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      router.push('/sign-in');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`flex items-center gap-3 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors ring-offset-background apple-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 w-full ${
            collapsed ? 'justify-center px-1' : 'px-3'
          }`}
        >
          <Avatar className="h-8 w-8 apple-shadow flex-shrink-0">
            <AvatarImage src={user?.image} alt={user?.name || 'User'} />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col items-start text-left overflow-hidden">
              <span className="text-sm font-medium truncate max-w-[140px]">
                {user?.name || 'User'}
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                {user?.email || 'user@example.com'}
              </span>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        className="w-56 bg-background border-border shadow-lg"
      >
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground font-medium">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />

        <DropdownMenuItem onClick={() => router.push('/account')} className="apple-transition">
          <UserIcon className="mr-2 h-4 w-4" />
          <span className="font-medium">{t('Sidebar.user_menu_account')}</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleGoToArena} className="apple-transition">
          <LayoutDashboardIcon className="mr-2 h-4 w-4" />
          <span className="font-medium">{t('Sidebar.user_menu_arena')}</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push('/settings')} className="apple-transition">
          <SettingsIcon className="mr-2 h-4 w-4" />
          <span className="font-medium">{t('Sidebar.user_menu_settings')}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border/50" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive cursor-pointer apple-transition"
        >
          <LogOutIcon className="mr-2 h-4 w-4" />
          <span className="font-medium">{t('Sidebar.user_menu_logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
