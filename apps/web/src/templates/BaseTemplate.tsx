'use client';

import { cn, ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@lmring/ui';
import { motion } from 'framer-motion';
import { useTranslations } from '@/hooks/use-translations';

import { AppConfig } from '@/utils/AppConfig';

// Custom scrollbar classes - softer colors
const scrollbarThin = [
  '[&::-webkit-scrollbar]:w-1.5',
  '[&::-webkit-scrollbar-track]:bg-transparent',
  '[&::-webkit-scrollbar-thumb]:bg-slate-600/30',
  '[&::-webkit-scrollbar-thumb]:rounded-full',
  '[&::-webkit-scrollbar-thumb]:hover:bg-slate-500/40',
].join(' ');

const scrollbarMinimal = [
  '[&::-webkit-scrollbar]:w-1',
  '[&::-webkit-scrollbar-track]:bg-transparent',
  '[&::-webkit-scrollbar-thumb]:bg-slate-500/20',
  '[&::-webkit-scrollbar-thumb]:rounded-full',
  '[&::-webkit-scrollbar-thumb]:hover:bg-slate-500/30',
].join(' ');

export const BaseTemplate = (props: {
  leftNav?: React.ReactNode;
  rightNav?: React.ReactNode;
  children: React.ReactNode;
  showSidebar?: boolean;
}) => {
  const t = useTranslations();
  const showSidebar = props.showSidebar ?? true;

  return (
    <div className="flex h-screen w-full flex-col bg-slate-900">
      {/* Subtle background - very soft, low contrast */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[400px] left-1/3 h-[800px] w-[800px] rounded-full bg-indigo-500/[0.03] blur-[180px]" />
        <div className="absolute -bottom-[300px] right-1/4 h-[600px] w-[600px] rounded-full bg-slate-400/[0.02] blur-[150px]" />
      </div>

      {/* Header */}
      <motion.header
        className="relative z-20 border-b border-slate-700/50 bg-slate-900/90 backdrop-blur-lg"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-4">
            {/* Logo - softer gradient */}
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-indigo-500/20 blur-xl" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/10">
                <span className="text-lg font-bold text-white">{AppConfig.name.charAt(0)}</span>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-100">
                {AppConfig.name}
              </h1>
              <p className="text-xs text-slate-400">{t('BaseTemplate.description')}</p>
            </div>
          </div>
          <nav>
            <ul className="flex items-center gap-2">{props.rightNav}</ul>
          </nav>
        </div>
        {/* Subtle bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-600/30 to-transparent" />
      </motion.header>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {showSidebar && props.leftNav ? (
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
              <motion.aside
                className={cn(
                  'h-full overflow-y-auto border-r border-slate-700/50 bg-slate-800/40 p-4',
                  scrollbarMinimal,
                )}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <nav aria-label="Main navigation">
                  <ul className="space-y-1">{props.leftNav}</ul>
                </nav>
              </motion.aside>
            </ResizablePanel>

            <ResizableHandle
              withHandle
              className="bg-transparent transition-colors hover:bg-indigo-500/10"
            />

            <ResizablePanel defaultSize={85}>
              <motion.main
                className={cn('h-full overflow-y-auto p-6', scrollbarThin)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {props.children}
              </motion.main>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <motion.main
            className={cn('flex-1 overflow-y-auto p-6', scrollbarThin)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            {props.children}
          </motion.main>
        )}
      </div>

      {/* Footer */}
      <motion.footer
        className="relative z-20 border-t border-slate-700/50 bg-slate-900/90 px-5 py-3 backdrop-blur-lg"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {AppConfig.name}
          </p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs text-slate-500">Online</span>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};
