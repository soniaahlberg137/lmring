# SSR → RSC Layout 迁移设计

- 状态：草稿（待实施）
- 日期：2026-04-29
- 目标分支：`refactor/rsc-layout`（建议命名）
- 关联：`apps/web` Next.js 16 App Router

## 1. 背景

`apps/web/src/app/layout.tsx` 与各 `(group)/layout.tsx` 当前虽然是 `async` 的 RSC，
但内部嵌套了 4 个 `'use client'` provider（`LanguageProvider` → `ThemeProvider` →
`QueryProvider` → `PostHogProvider`），并在 `(auth)/layout.tsx` 同步 `await
auth.api.getSession()`。结果：

1. 整个组件树几乎都被推到 client 边界之后，(landing)/(public) 静态页也加载了
   QueryProvider、PostHog 等不必要的 JS。
2. (auth) layout 在 session RSC 渲染完成前阻塞，骨架不能先到达浏览器。
3. 客户端 provider 嵌套层数偏多，且 leaderboard layout 与 (auth) layout 重复实现
   `await getSession` + `StoreProviders` 包裹的相同模式。

## 2. 目标 / 非目标

### 目标
- RootLayout 仅保留全站必要的 client provider（i18n + theme + toaster）。
- 把 `QueryProvider`、`PostHogProvider`、`StoreProviders` 下沉到需要它们的子树。
- 鉴权从 `(auth)/layout.tsx` 的 `await getSession` 迁移到 `middleware.ts`；layout
  不再阻塞，使用 `React.cache()` + `<Suspense>` 流式渲染 sidebar 用户区。
- (landing)、(auth-pages)、(public)/{privacy,terms,how-it-works} 子树达到「几乎纯
  RSC」：仅交互组件单点 `'use client'`。

### 非目标
- 不重构 i18n（保持 `LanguageProvider` 客户端切语言机制）。
- 不替换 TanStack Query 为 RSC + Server Actions。
- 不引入 Promise-based UserProvider（next 16 的 `use(promise)` 模式）。
- 不修改 `packages/*` 共享包。

## 3. 架构变更

### 3.1 当前结构（简化）

```
RootLayout (RSC, async)
└─ LanguageProvider (client)
   └─ ThemeProvider (client)
      └─ QueryProvider (client)        ← 全站
         └─ PostHogProvider (client)    ← 全站
            └─ children
               └─ (auth) layout: await getSession + StoreProviders
               └─ (public)/leaderboard layout: await getSession + StoreProviders
               └─ (landing) layout (静态)
               └─ (auth-pages) layout (静态)
```

### 3.2 目标结构

```
RootLayout (RSC, async)
└─ LanguageProvider (client)
   └─ ThemeProvider (client)
      └─ Toaster
         └─ children                  // 不再裹 Query/PostHog/Store

(auth) layout (RSC, 不再 await)
└─ AuthedClientProviders (client, 新增, 含 Query+Store+PostHog)
   └─ <Suspense fallback={<SidebarSkeleton/>}>
         └─ SidebarServer (RSC, await getCachedUser)
            └─ Sidebar (client)
   └─ <main>{children}</main>

(public)/leaderboard layout (RSC)
└─ PublicClientProviders (client, 新增, 仅 Query+Store)
   └─ <Suspense fallback={<SidebarSkeleton/>}>
         └─ SidebarServer
   └─ <main>{children}</main>

(landing) / (public)/{privacy,terms,how-it-works} / (auth-pages)
└─ 直接 RSC，无客户端 provider 包裹（仅顶层三个）
```

### 3.3 关键文件

| 操作 | 路径 | 内容 |
|---|---|---|
| 修改 | `apps/web/src/app/layout.tsx` | 移除 QueryProvider/PostHogProvider |
| 新增 | `apps/web/src/middleware.ts`* | 未登录访问 (auth) → redirect /sign-in |
| 修改 | `apps/web/src/app/(auth)/layout.tsx` | 去 await，加 Suspense + SidebarServer |
| 修改 | `apps/web/src/app/(public)/leaderboard/layout.tsx` | 同上 |
| 新增 | `apps/web/src/providers/authed-client-providers.tsx` | Query+Store+PostHog |
| 新增 | `apps/web/src/providers/public-client-providers.tsx` | Query+Store |
| 新增 | `apps/web/src/libs/get-cached-user.ts` | `cache(getSession)` 封装 |
| 新增 | `apps/web/src/components/sidebar-server.tsx` | RSC，注入 user props |
| 新增 | `apps/web/src/components/sidebar-skeleton.tsx` | 流式 fallback |

\* middleware 文件位置取决于 monorepo 当前是否已存在；若已有则在内部扩展。

## 4. 实现细节

### 4.1 Middleware 鉴权

仅检测 cookie 存在性（轻量级 edge 短路）；真正的 session 校验仍在 RSC 层
`getCachedUser()` 内执行。

```ts
// apps/web/src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const AUTH_PREFIXES = ['/arena', '/history', '/settings', '/account', '/webdev'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = AUTH_PREFIXES.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const sessionCookie = getSessionCookie(req);
  if (!sessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/arena/:path*',
    '/history/:path*',
    '/settings/:path*',
    '/account/:path*',
    '/webdev/:path*',
  ],
};
```

> 实施前需校验 `getSessionCookie` 在当前 `better-auth` 版本中存在；若不存在，
> 退回 `req.cookies.get('<better-auth-session-cookie-name>')` 读取。

### 4.2 `get-cached-user.ts`

```ts
import { cache } from 'react';
import { headers } from 'next/headers';
import { auth } from '@/libs/Auth';

export const getCachedUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return {
    name: session.user.name || session.user.email,
    email: session.user.email,
    image: session.user.image || 'https://github.com/shadcn.png',
  };
});
```

`React.cache` 保证同一请求内多个 RSC 调用复用结果。

### 4.3 SidebarServer

```tsx
// components/sidebar-server.tsx (RSC)
import { Sidebar } from './sidebar';
import { getCachedUser } from '@/libs/get-cached-user';

export async function SidebarServer() {
  const user = await getCachedUser();
  return <Sidebar user={user ?? undefined} />;
}
```

### 4.4 (auth)/layout.tsx

```tsx
import { Suspense } from 'react';
import { SidebarSkeleton } from '@/components/sidebar-skeleton';
import { SidebarServer } from '@/components/sidebar-server';
import { AuthedClientProviders } from '@/providers/authed-client-providers';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthedClientProviders>
      <div className="flex h-screen bg-background">
        <Suspense fallback={<SidebarSkeleton />}>
          <SidebarServer />
        </Suspense>
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </AuthedClientProviders>
  );
}
```

### 4.5 AuthedClientProviders / PublicClientProviders

```tsx
// providers/authed-client-providers.tsx
'use client';
import type { ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { StoreProviders } from './store-providers';
import { PostHogProvider } from '@/components/analytics/PostHogProvider';

export function AuthedClientProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <PostHogProvider>
        <StoreProviders>{children}</StoreProviders>
      </PostHogProvider>
    </QueryProvider>
  );
}
```

```tsx
// providers/public-client-providers.tsx
'use client';
import type { ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { StoreProviders } from './store-providers';

export function PublicClientProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <StoreProviders>{children}</StoreProviders>
    </QueryProvider>
  );
}
```

> PostHog 仅在 (auth) 内加载（已与用户确认），未登录访客事件不再采集。

### 4.6 RootLayout 调整

仅保留 i18n + theme + toaster；移除 QueryProvider/PostHogProvider；
`Toaster` 与 children 平级（避免被多次实例化）。

### 4.7 (public)/leaderboard layout

不再 `await getSession`，不再做未登录早期 return；改为始终渲染外壳，
`SidebarServer` 内 user 为 null 时不渲染用户区。

## 5. 测试与验收

### 5.1 类型检查 + Lint
- `pnpm --filter @lmring/web check:types`
- `pnpm lint:fix && pnpm lint`
- 0 error 才能合并。

### 5.2 单元测试（vitest，使用 `vi.spyOn`）

| 文件 | 用例 |
|---|---|
| `providers/authed-client-providers.test.tsx`（新增） | children 可见；嵌套 `useQuery`/`useStore` 钩子可工作（dummy consumer） |
| `providers/public-client-providers.test.tsx`（新增） | 同上，不含 PostHog |
| `libs/get-cached-user.test.ts`（新增） | spy `auth.api.getSession`：null → 返回 null；session → 返回映射 userData；同请求两次调用仅触发一次底层 getSession |
| `components/sidebar-server.test.tsx`（新增） | spy `getCachedUser`：null → Sidebar 收到 `user={undefined}`；有 user → 收到映射 user |
| `middleware.test.ts`（新增） | `/arena` 无 cookie → redirect `/sign-in?redirect=/arena`；有 cookie → next；`/landing` → next |

### 5.3 Bundle size 对比
- 迁移前在 main 上跑 `pnpm --filter @lmring/web build`，记录每条路由 First Load JS。
- 迁移后再跑一次，把 before/after 表贴入 PR 描述。
- 重点路由：`/`、`/sign-in`、`/leaderboard`、`/arena`。
- 阈值：`/` 和 `/sign-in` 必须下降；`/arena` 持平或略降即可。

### 5.4 手动 smoke
1. 未登录访问 `/arena` → 重定向到 `/sign-in?redirect=/arena`。
2. 登录访问 `/arena` → sidebar 骨架先出，随后流式替换。
3. `/leaderboard` 已登录态展示 sidebar；未登录态展示纯榜单。
4. 中→英在 `/arena` 与 `/` 上仍生效。
5. 主题切换全站生效。
6. `/arena` 内新建对话、删除对话（react-query mutation）正常。

## 6. 风险与回滚

| 风险 | 缓解 |
|---|---|
| `getSessionCookie` API 在当前 better-auth 版本不存在 | 实施前 grep 校验；回退 `req.cookies.get(...)` |
| middleware matcher 漏路由 | 与 `(auth)` 子目录清单一一对照 + 单测覆盖 |
| Suspense fallback 视觉抖动 | `SidebarSkeleton` 严格匹配 W-64/W-16 折叠宽度 |
| QueryProvider 挂载点变更后父级仍调用 hooks | grep `useQuery|useMutation|useQueryClient`，确认全部位于 (auth)/(public)/leaderboard 子树 |
| PostHog 未登录访客事件丢失 | 已与用户确认下沉到 (auth)；如反悔，仅需把 PostHogProvider 移回 RootLayout |

### 回滚
单分支单 PR；如线上出问题 revert merge commit 即可恢复 await getSession 旧 layout。
middleware 文件回滚时一并删除。

## 7. 实施顺序

1. 新增 `get-cached-user.ts`、`AuthedClientProviders`、`PublicClientProviders`、
   `SidebarSkeleton`、`SidebarServer`（不接入旧 layout）。
2. 新增 `middleware.ts` + 单测。
3. 改 `(auth)/layout.tsx`、`(public)/leaderboard/layout.tsx` 接入新结构。
4. 改 `RootLayout`，移除 QueryProvider/PostHogProvider。
5. 跑 build，记录 bundle 对比；跑 vitest 全部相关用例。
6. 手动 smoke 4 条路径。

## 8. 未决项

无（PostHog 范围已确认下沉到 (auth)）。
