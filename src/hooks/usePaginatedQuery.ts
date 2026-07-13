import { useState, useCallback, useRef, useEffect } from "react";
import type { SortingState, PaginationState } from "@tanstack/react-table";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

interface UsePaginatedQueryOptions {
  defaultPageSize?: number;
  defaultSortBy?: string;
  defaultSortOrder?: "asc" | "desc";
}

interface UsePaginatedQueryReturn {
  pagination: PaginationState;
  setPagination: (pagination: PaginationState) => void;
  sorting: SortingState;
  setSorting: (sorting: SortingState) => void;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  debouncedFilter: string;
  // Derived values for service params
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export function usePaginatedQuery(
  options: UsePaginatedQueryOptions = {}
): UsePaginatedQueryReturn {
  const {
    defaultPageSize = DEFAULT_PAGE_SIZE,
    defaultSortBy = "created_at",
    defaultSortOrder = "desc",
  } = options;

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  const [sorting, setSorting] = useState<SortingState>(
    defaultSortBy
      ? [{ id: defaultSortBy, desc: defaultSortOrder === "desc" }]
      : []
  );

  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const debounceTimer = useRef<any>(null);

  // Debounce the global filter
  const handleGlobalFilterChange = useCallback((value: string) => {
    setGlobalFilter(value);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedFilter(value);
      // Reset to first page on new search
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 300);
  }, []);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Derived sort values
  const sortBy = sorting.length > 0 ? sorting[0].id : defaultSortBy;
  const sortOrder =
    sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : defaultSortOrder;

  return {
    pagination,
    setPagination,
    sorting,
    setSorting,
    globalFilter,
    setGlobalFilter: handleGlobalFilterChange,
    debouncedFilter,
    sortBy,
    sortOrder,
  };
}
