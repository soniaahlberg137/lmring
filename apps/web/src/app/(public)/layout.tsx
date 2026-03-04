export default function PublicLayout(props: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-white">
      <main className="pt-8">{props.children}</main>
    </div>
  );
}
