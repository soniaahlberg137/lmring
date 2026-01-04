export default async function AuthPagesLayout(props: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center">{props.children}</div>;
}
