'use client';

import { Card, CardContent, Skeleton } from '@lmring/ui';

interface LeaderboardTableSkeletonProps {
  rows?: number;
  metricColumns?: number;
}

function ControlsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-24 rounded-md" />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </div>
      <Skeleton className="h-5 w-24" />
    </div>
  );
}

function TableHeaderSkeleton({ metricColumns }: { metricColumns: number }) {
  return (
    <thead>
      <tr className="border-b border-border">
        <th className="px-3 py-3 w-16">
          <Skeleton className="h-4 w-10" />
        </th>
        <th className="px-3 py-3 min-w-[200px]">
          <Skeleton className="h-4 w-16" />
        </th>
        {Array.from({ length: metricColumns }).map((_, index) => (
          <th key={index} className="px-3 py-3">
            <Skeleton className="h-4 w-16 ml-auto" />
          </th>
        ))}
        <th className="px-3 py-3">
          <Skeleton className="h-4 w-24 mx-auto" />
        </th>
        <th className="px-3 py-3">
          <Skeleton className="h-4 w-20 mx-auto" />
        </th>
        <th className="px-3 py-3 min-w-[100px]">
          <Skeleton className="h-4 w-16 mx-auto" />
        </th>
      </tr>
    </thead>
  );
}

function TableRowSkeleton({ metricColumns }: { metricColumns: number }) {
  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="px-3 py-4">
        <Skeleton className="h-6 w-6 rounded-full" />
      </td>
      <td className="px-3 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </td>
      {Array.from({ length: metricColumns }).map((_, index) => (
        <td key={index} className="px-3 py-4 text-right">
          <Skeleton className="h-4 w-12 ml-auto" />
        </td>
      ))}
      <td className="px-3 py-4 text-center">
        <Skeleton className="h-4 w-16 mx-auto" />
      </td>
      <td className="px-3 py-4 text-center">
        <Skeleton className="h-4 w-4 mx-auto" />
      </td>
      <td className="px-3 py-4 text-center">
        <Skeleton className="h-4 w-16 mx-auto" />
      </td>
    </tr>
  );
}

function PaginationSkeleton() {
  return (
    <div className="flex items-center justify-between px-2">
      <Skeleton className="h-5 w-24" />
      <div className="flex items-center gap-1">
        <Skeleton className="h-8 w-16 rounded-md" />
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-8 rounded-md" />
        ))}
        <Skeleton className="h-8 w-12 rounded-md" />
      </div>
    </div>
  );
}

export function LeaderboardContentSkeleton({
  rows = 10,
  metricColumns = 7,
}: LeaderboardTableSkeletonProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <TableHeaderSkeleton metricColumns={metricColumns} />
          <tbody className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, index) => (
              <TableRowSkeleton key={index} metricColumns={metricColumns} />
            ))}
          </tbody>
        </table>
      </div>

      <PaginationSkeleton />
    </div>
  );
}

export function LeaderboardTableSkeleton({
  rows = 10,
  metricColumns = 7,
}: LeaderboardTableSkeletonProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <ControlsSkeleton />
          </div>

          <LeaderboardContentSkeleton rows={rows} metricColumns={metricColumns} />
        </CardContent>
      </Card>
    </div>
  );
}
