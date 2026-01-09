'use client';

import { cn } from '@lmring/ui';
import {
  type ColumnDef,
  type ColumnResizeMode,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  pageSize?: number;
}

export function DataTable<TData>({ columns, data, pageSize = 20 }: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnResizeMode] = useState<ColumnResizeMode>('onEnd');

  const table = useReactTable({
    data,
    columns,
    columnResizeMode,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  const currentPage = table.getState().pagination.pageIndex;
  const totalPages = table.getPageCount();

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border/50">
        <table className="w-full" style={{ minWidth: '100%', tableLayout: 'fixed' }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border/50 bg-muted/30">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="relative px-4 py-3 text-left text-xs font-medium text-muted-foreground group"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {/* Column resize handle - mouse/touch only, keyboard not applicable */}
                    {header.column.getCanResize() && (
                      // biome-ignore lint/a11y/noStaticElementInteractions: Resize handle is mouse-only UI
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onDoubleClick={() => header.column.resetSize()}
                        className={cn(
                          'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none',
                          'opacity-0 group-hover:opacity-100 transition-opacity',
                          'bg-border hover:bg-primary',
                          header.column.getIsResizing() && 'bg-primary opacity-100',
                        )}
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, idx) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-border/30 transition-colors hover:bg-muted/50',
                  idx % 2 === 0 ? 'bg-background' : 'bg-muted/10',
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3" style={{ width: cell.column.getSize() }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1 pt-2">
        <span className="text-xs tabular-nums text-muted-foreground/70 tracking-tight">
          {table.getState().pagination.pageIndex * pageSize + 1}–
          {Math.min((table.getState().pagination.pageIndex + 1) * pageSize, data.length)}{' '}
          <span className="text-muted-foreground/50">of</span> {data.length}
        </span>

        <div className="flex items-center gap-1">
          {/* Previous */}
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium cursor-pointer',
              'transition-all duration-150 ease-out',
              'text-muted-foreground hover:text-foreground hover:bg-muted/60',
              'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground',
            )}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center bg-muted/30 rounded-lg p-0.5">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i;
              } else if (currentPage <= 2) {
                pageNum = i;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 5 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              const isActive = currentPage === pageNum;
              return (
                <button
                  type="button"
                  key={pageNum}
                  onClick={() => table.setPageIndex(pageNum)}
                  className={cn(
                    'relative h-7 min-w-[28px] px-2 rounded-md text-xs font-medium tabular-nums cursor-pointer',
                    'transition-all duration-150 ease-out',
                    isActive
                      ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {pageNum + 1}
                </button>
              );
            })}
          </div>

          {/* Next */}
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium cursor-pointer',
              'transition-all duration-150 ease-out',
              'text-muted-foreground hover:text-foreground hover:bg-muted/60',
              'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground',
            )}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
