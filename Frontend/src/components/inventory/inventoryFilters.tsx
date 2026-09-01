import { useState, useRef, useEffect } from "react";
import { Filter, ChevronDown, X } from "lucide-react";

// Stock level filter options — maps to our reorder_level logic
export type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

export interface ActiveFilters {
  category:   string;      // "" means All
  stockLevel: StockFilter;
}

interface InventoryFiltersProps {
  categories:    string[];          // from API
  activeFilters: ActiveFilters;
  onChange:      (filters: ActiveFilters) => void;
}

export const InventoryFilters = ({
  categories,
  activeFilters,
  onChange,
}: InventoryFiltersProps) => {
  const [catOpen,   setCatOpen]   = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const catRef   = useRef<HTMLDivElement>(null);
  const stockRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current   && !catRef.current.contains(e.target as Node))   setCatOpen(false);
      if (stockRef.current && !stockRef.current.contains(e.target as Node)) setStockOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const stockOptions: { value: StockFilter; label: string }[] = [
    { value: "all",           label: "All levels"   },
    { value: "in_stock",      label: "In stock"     },
    { value: "low_stock",     label: "Low stock"    },
    { value: "out_of_stock",  label: "Out of stock" },
  ];

  const hasActiveFilters =
    activeFilters.category !== "" || activeFilters.stockLevel !== "all";

  const clearFilters = () =>
    onChange({ category: "", stockLevel: "all" });

  // Shared dropdown button style
  const triggerCls = (open: boolean, hasValue: boolean) =>
    `flex items-center gap-2 h-9 px-3 rounded-xl border text-sm font-medium transition-all cursor-pointer
     ${hasValue
       ? "border-[#0EA5A0] bg-[#F0FAFA] text-[#0EA5A0]"
       : open
       ? "border-[#1B2B4B] bg-gray-50 text-[#1B2B4B]"
       : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter size={15} className="text-gray-400 flex-shrink-0" />

      {/* ── Category dropdown ── */}
      <div ref={catRef} className="relative">
        <button
          type="button"
          onClick={() => { setCatOpen(!catOpen); setStockOpen(false); }}
          className={triggerCls(catOpen, activeFilters.category !== "")}
        >
          <span>{activeFilters.category || "All categories"}</span>
          <ChevronDown size={13} className={`transition-transform ${catOpen ? "rotate-180" : ""}`} />
        </button>

        {catOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200
                          rounded-xl shadow-lg z-30 overflow-hidden min-w-[160px]">
            {/* All option */}
            <button
              type="button"
              onClick={() => { onChange({ ...activeFilters, category: "" }); setCatOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                ${activeFilters.category === ""
                  ? "bg-[#F0FAFA] text-[#0EA5A0] font-semibold"
                  : "text-[#1B2B4B] hover:bg-gray-50"}`}
            >
              All categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => { onChange({ ...activeFilters, category: cat }); setCatOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm border-t border-gray-50 transition-colors
                  ${activeFilters.category === cat
                    ? "bg-[#F0FAFA] text-[#0EA5A0] font-semibold"
                    : "text-[#1B2B4B] hover:bg-gray-50"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Stock level dropdown ── */}
      <div ref={stockRef} className="relative">
        <button
          type="button"
          onClick={() => { setStockOpen(!stockOpen); setCatOpen(false); }}
          className={triggerCls(stockOpen, activeFilters.stockLevel !== "all")}
        >
          <span>
            {stockOptions.find(o => o.value === activeFilters.stockLevel)?.label ?? "All levels"}
          </span>
          <ChevronDown size={13} className={`transition-transform ${stockOpen ? "rotate-180" : ""}`} />
        </button>

        {stockOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200
                          rounded-xl shadow-lg z-30 overflow-hidden min-w-[160px]">
            {stockOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange({ ...activeFilters, stockLevel: opt.value }); setStockOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 last:border-0 transition-colors
                  ${activeFilters.stockLevel === opt.value
                    ? "bg-[#F0FAFA] text-[#0EA5A0] font-semibold"
                    : "text-[#1B2B4B] hover:bg-gray-50"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Clear filters pill — only shown when filters are active ── */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="flex items-center gap-1 h-9 px-3 rounded-xl border border-red-200
                     bg-red-50 text-red-500 text-sm font-medium hover:bg-red-100 transition-colors"
        >
          <X size={12} /> Clear
        </button>
      )}
    </div>
  );
};