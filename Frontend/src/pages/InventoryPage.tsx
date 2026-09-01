import { useState, useEffect, useMemo } from "react";
import { Search, X, LayoutGrid }  from "lucide-react";
import { ItemCard, type ItemCardData }  from "../components/inventory/itemCard";
import { InventoryFilters, type ActiveFilters } from "../components/inventory/inventoryFilters";
import { PaginationBar }                from "../components/inventory/paginationBar";
import { usePagination }                from "../hooks/usePagination";

// How many items per page — adjust to taste
const PAGE_SIZE = 12;

// ── Backend URL — same pattern as your searchItems function ──
const Backend = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

export const InventoryPage = () => {
  // Raw data from API
  const [items,      setItems]      = useState<ItemCardData[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  // Search
  const [searchQuery,    setSearchQuery]    = useState("");
  const [searchResults,  setSearchResults]  = useState<ItemCardData[] | null>(null);
  const [isSearching,    setIsSearching]    = useState(false);

  // Filters
  const [filters, setFilters] = useState<ActiveFilters>({
    category:   "",
    stockLevel: "all",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // ── Fetch all items on mount ─────────────────────────────
  useEffect(() => {
    const fetchItems = async () => {
      const token = localStorage.getItem("JORISA_TOKEN");
      setIsLoading(true);
      try {
        const res = await fetch(`${Backend}/items/all`, {
          headers: {
            "Authorization":            `Bearer ${token}`,
            "Content-Type":             "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });

        if (!res.ok) throw new Error("Failed to load inventory");
        const data: ItemCardData[] = await res.json();
        setItems(data);

      } catch (err) {
        setError("Could not load inventory. Check your connection.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, []);

  // ── Search — reuses your existing searchItems pattern ────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null); // null means "show all / use filters"
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);

      const token = localStorage.getItem("JORISA_TOKEN");

      try {
        const res = await fetch(
          `${Backend}/items/search?query=${encodeURIComponent(searchQuery.trim())}`,
          {
            headers: {
              "Authorization":              `Bearer ${token}`,
              "Content-Type":               "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          }
        );

        if (!res.ok) {
            throw new Error("Search failed");
        }

        const data = await res.json();
        setSearchResults(data);

      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 200); // 350ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Derive categories list from loaded items ─────────────
  // useMemo means this only recalculates when items changes
  const categories = useMemo(
    () => [...new Set(items.map((i) => i.category))].sort(),
    [items]
  );

  // ── Apply filters on top of search results or all items ──
  const filteredItems = useMemo(() => {
    // Start from search results if search is active, otherwise all items
    const base = searchResults ?? items;

    return base.filter((item) => {
      // Category filter
      if (filters.category && item.category !== filters.category) return false;

      // Stock level filter — ties to reorder_level from our schema
      if (filters.stockLevel === "out_of_stock" && item.quantity !== 0)           return false;
      if (filters.stockLevel === "low_stock"    && !(item.quantity > 0 && item.quantity <= item.reorder_level)) return false;
      if (filters.stockLevel === "in_stock"     && item.quantity <= item.reorder_level) return false;

      return true;
    });
  }, [items, searchResults, filters]);

  // ── Reset to page 1 whenever filters/search changes ─────
  useEffect(() => { setCurrentPage(1); }, [filters, searchQuery]);

  // ── Pagination ───────────────────────────────────────────
  const { paginationRange, totalPages } = usePagination({
    totalCount:  filteredItems.length,
    pageSize:    PAGE_SIZE,
    currentPage,
  });

  // Slice the filtered items for the current page
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="w-full pb-6">

      {/* ── Page title ── */}
     

      {/* ── Search bar ── */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Find..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-9 bg-white border border-gray-200 rounded-2xl
                     text-sm text-[#1B2B4B] placeholder:text-gray-300
                     focus:outline-none focus:border-[#0EA5A0] focus:ring-2 focus:ring-[#0EA5A0]/20
                     transition-all"
        />
        {/* Clear search / loading indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-[#0EA5A0]/30 border-t-[#0EA5A0] rounded-full animate-spin" />
          ) : searchQuery ? (
            <button onClick={() => setSearchQuery("")}>
              <X size={14} className="text-gray-400 hover:text-gray-600" />
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Filters + item count ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <InventoryFilters
          categories={categories}
          activeFilters={filters}
          onChange={setFilters}
        />
        <p className="text-xs text-gray-400 flex-shrink-0">
          {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
          {(filters.category || filters.stockLevel !== "all" || searchQuery) ? " found" : " total"}
        </p>
      </div>

      {/* ── Loading state ── */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            // Skeleton loader — same shape as ItemCard
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="w-full aspect-[4/3] bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-8 w-8 bg-gray-100 rounded-full mx-auto" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Error state ── */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-semibold text-red-500 mb-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-[#0EA5A0] hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && !error && filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <LayoutGrid size={32} className="text-gray-200 mb-3" />
          <p className="text-sm font-semibold text-gray-400">
            {searchQuery ? `No results for "${searchQuery}"` : "No items match these filters"}
          </p>
          <button
            onClick={() => { setSearchQuery(""); setFilters({ category: "", stockLevel: "all" }); }}
            className="text-xs text-[#0EA5A0] hover:underline mt-2"
          >
            Clear search and filters
          </button>
        </div>
      )}

      {/* ── Item grid ── */}
      {!isLoading && !error && pagedItems.length > 0 && (
        <>
          {/*
            grid-cols-2       → 2 columns on mobile (matches wireframe)
            md:grid-cols-3    → 3 columns on tablet
            lg:grid-cols-4    → 4 columns on large desktop
          */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {pagedItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>

          {/* ── Pagination ── */}
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            paginationRange={paginationRange}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};

