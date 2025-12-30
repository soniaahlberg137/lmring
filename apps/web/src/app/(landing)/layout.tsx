export default function LandingLayout(props: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col font-sans text-foreground">
      <main className="flex-1">{props.children}</main>
    </div>
  );
}
