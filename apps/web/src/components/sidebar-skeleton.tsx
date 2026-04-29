export function SidebarSkeleton() {
  return (
    <aside
      aria-hidden="true"
      className="hidden lg:flex flex-col h-screen w-64 bg-sidebar sidebar-container z-30"
    >
      <div className="h-16 flex items-center gap-2 px-4 border-b border-sidebar-border">
        <div className="h-6 w-6 rounded bg-sidebar-accent/40 animate-pulse" />
        <div className="h-4 w-20 rounded bg-sidebar-accent/40 animate-pulse" />
      </div>
      <nav className="flex-1 p-3 space-y-2">
        {['nav-1', 'nav-2', 'nav-3'].map((key) => (
          <div key={key} className="flex items-center gap-3 px-3 py-2">
            <div className="h-5 w-5 rounded bg-sidebar-accent/40 animate-pulse" />
            <div className="h-4 w-24 rounded bg-sidebar-accent/40 animate-pulse" />
          </div>
        ))}
      </nav>
      <div className="p-3 mt-auto">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent/40 animate-pulse" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-20 rounded bg-sidebar-accent/40 animate-pulse" />
            <div className="h-3 w-28 rounded bg-sidebar-accent/30 animate-pulse" />
          </div>
        </div>
      </div>
    </aside>
  );
}
