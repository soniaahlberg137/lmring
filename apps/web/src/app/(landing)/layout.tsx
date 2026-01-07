export default function LandingLayout(props: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-y-auto font-sans text-foreground scrollbar-thin scrollbar-thumb-slate-600/50 scrollbar-track-transparent">
      <main className="flex-1">{props.children}</main>
    </div>
  );
}
