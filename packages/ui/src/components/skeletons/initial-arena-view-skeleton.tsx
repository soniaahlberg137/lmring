import { Skeleton } from '../skeleton';

function InitialArenaViewSkeleton() {
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="w-full max-w-2xl space-y-4">
          {/* Prompt input skeleton */}
          <div className="rounded-xl border border-input bg-background p-3 space-y-3">
            <Skeleton className="h-24 rounded-lg" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
          </div>

          {/* Model tab bar skeleton */}
          <div className="flex items-center gap-2 justify-center">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
            <div className="h-10 w-10 rounded-lg border border-dashed border-border/50 flex items-center justify-center">
              <Skeleton className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { InitialArenaViewSkeleton };
