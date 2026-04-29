import { Sidebar } from '@/components/sidebar';
import { getCachedUser } from '@/libs/get-cached-user';

export async function SidebarServer() {
  const user = await getCachedUser();
  return <Sidebar user={user ?? undefined} />;
}
