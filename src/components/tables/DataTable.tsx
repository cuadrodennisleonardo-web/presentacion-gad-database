import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants";

interface DataTableProps<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  data: T[];
  isLoading?: boolean;
  pageCount?: number;
  rowCount?: number;
  pagination: PaginationState;
  onPaginationChange: (pagination: PaginationState) => void;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onExportCSV?: () => void;
  filterContent?: React.ReactNode;
}

function DataTable<T>({
  columns,
  data,
  isLoading = false,
  pageCount = 0,
  rowCount = 0,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  globalFilter = "",
  onGlobalFilterChange,
  emptyMessage = "No records found.",
  emptyIcon,
  onExportCSV,
  filterContent,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      onSortingChange(newSorting);
    },
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === "function" ? updater(pagination) : updater;
      onPaginationChange(newPagination);
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  const startRow = pagination.pageIndex * pagination.pageSize + 1;
  const endRow = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    rowCount
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          {onGlobalFilterChange && (
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="9" r="6" />
                <path d="M13.5 13.5L17 17" />
              </svg>
              <input
                type="text"
                value={globalFilter}
                onChange={(e) => onGlobalFilterChange(e.target.value)}
                placeholder="Search..."
                className="h-10 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:placeholder-gray-500 dark:focus:border-brand-400 sm:w-64"
              />
            </div>
          )}
          {/* Filter content slot */}
          {filterContent}
        </div>

        <div className="flex items-center gap-3">
          {/* Row count badge */}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {rowCount.toLocaleString()} total
          </span>

          {/* CSV Export */}
          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 3.333v10M10 13.333l3.333-3.333M10 13.333l-3.333-3.333" />
                <path d="M3.333 16.667h13.334" />
              </svg>
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-gray-200 dark:border-gray-800"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400",
                      header.column.getCanSort() &&
                        "cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    <div className="flex items-center gap-1.5">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {header.column.getCanSort() && (
                        <span className="inline-flex flex-col">
                          <svg
                            className={cn(
                              "h-3 w-3 -mb-0.5",
                              header.column.getIsSorted() === "asc"
                                ? "text-brand-500"
                                : "text-gray-300 dark:text-gray-600"
                            )}
                            viewBox="0 0 10 6"
                            fill="currentColor"
                          >
                            <path d="M5 0L10 6H0L5 0Z" />
                          </svg>
                          <svg
                            className={cn(
                              "h-3 w-3",
                              header.column.getIsSorted() === "desc"
                                ? "text-brand-500"
                                : "text-gray-300 dark:text-gray-600"
                            )}
                            viewBox="0 0 10 6"
                            fill="currentColor"
                          >
                            <path d="M5 6L0 0H10L5 6Z" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              // Skeleton rows
              Array.from({ length: pagination.pageSize }).map((_, i) => (
                <tr
                  key={`skeleton-${i}`}
                  className="border-b border-gray-100 dark:border-gray-800/50"
                >
                  {columns.map((_, j) => (
                    <td key={`skeleton-${i}-${j}`} className="px-5 py-3.5">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-white/[0.02]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              // Empty state
              <tr>
                <td colSpan={columns.length} className="px-5 py-16">
                  <div className="flex flex-col items-center justify-center">
                    {emptyIcon || (
                      <svg
                        className="h-12 w-12 text-gray-300 dark:text-gray-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="9" y1="21" x2="9" y2="9" />
                      </svg>
                    )}
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {rowCount > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 px-5 py-4 sm:flex-row dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing {startRow}–{endRow} of {rowCount.toLocaleString()}
            </span>
            <select
              value={pagination.pageSize}
              onChange={(e) =>
                onPaginationChange({
                  ...pagination,
                  pageIndex: 0,
                  pageSize: Number(e.target.value),
                })
              }
              className="rounded-lg border border-gray-300 bg-transparent px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-gray-300"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                onPaginationChange({ ...pagination, pageIndex: 0 })
              }
              disabled={!table.getCanPreviousPage()}
              className="rounded-lg px-2 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/5"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 3L6 8l5 5" />
                <path d="M7 3L2 8l5 5" />
              </svg>
            </button>
            <button
              onClick={() =>
                onPaginationChange({
                  ...pagination,
                  pageIndex: pagination.pageIndex - 1,
                })
              }
              disabled={!table.getCanPreviousPage()}
              className="rounded-lg px-2 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/5"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 3L5 8l5 5" />
              </svg>
            </button>

            {/* Page numbers */}
            {generatePageNumbers(
              pagination.pageIndex,
              pageCount
            ).map((page, i) =>
              page === -1 ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-1 text-gray-400 dark:text-gray-500"
                >
                  …
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() =>
                    onPaginationChange({ ...pagination, pageIndex: page })
                  }
                  className={cn(
                    "min-w-[32px] rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
                    page === pagination.pageIndex
                      ? "bg-brand-500 text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                  )}
                >
                  {page + 1}
                </button>
              )
            )}

            <button
              onClick={() =>
                onPaginationChange({
                  ...pagination,
                  pageIndex: pagination.pageIndex + 1,
                })
              }
              disabled={!table.getCanNextPage()}
              className="rounded-lg px-2 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/5"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 3l5 5-5 5" />
              </svg>
            </button>
            <button
              onClick={() =>
                onPaginationChange({
                  ...pagination,
                  pageIndex: pageCount - 1,
                })
              }
              disabled={!table.getCanNextPage()}
              className="rounded-lg px-2 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/5"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 3l5 5-5 5" />
                <path d="M9 3l5 5-5 5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page Number Generator ──────────────────────────────────
function generatePageNumbers(
  currentPage: number,
  totalPages: number
): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const pages: number[] = [];

  // Always show first page
  pages.push(0);

  if (currentPage > 2) {
    pages.push(-1); // ellipsis
  }

  // Pages around current
  for (
    let i = Math.max(1, currentPage - 1);
    i <= Math.min(totalPages - 2, currentPage + 1);
    i++
  ) {
    pages.push(i);
  }

  if (currentPage < totalPages - 3) {
    pages.push(-1); // ellipsis
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages - 1);
  }

  return pages;
}

export default DataTable;
