import { useState, useRef ,useEffect} from "react";
import { useNavigate, useLocation }      from "react-router-dom";
import { ArrowLeft, Search, X, ScanBarcode } from "lucide-react";
import type { DispatchCartItem } from "../types/dispatch";

const Backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface ItemSearchResult {
  id:            number;
  name:          string;
  barcode:       string;
  category:      string;
  quantity:      number; // current stock
  unit_price:    number; // from stock table
}

const REASONS = ["Sale", "Spoilt", "Internal use"];

const searchItems = async (query: string): Promise<ItemSearchResult[]> => {
  const token = localStorage.getItem("JORISA_TOKEN");
  try {
    const res = await fetch(
      `${Backend}/items/search?query=${encodeURIComponent(query.trim())}`,
      {
        headers: {
          "Authorization":              `Bearer ${token}`,
          "Content-Type":               "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      }
    );
    if (!res.ok) throw new Error("Search failed");
    return await res.json();
  } catch {
    return [];
  }
};

export const AddIndividualDispatchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Receive existing cart from parent so we can pass it back
  const existingCart: DispatchCartItem[] = location.state?.currentCart ?? [];

  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<ItemSearchResult[]>([]);
  const [isSearching,   setIsSearching]   = useState(false);
  const [showDropdown,  setShowDropdown]  = useState(false);
  const searchTimer                       = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [selectedItem,  setSelectedItem]  = useState<ItemSearchResult | null>(null);
  const [qtyToRemove,   setQtyToRemove]   = useState("");
  const [reason,        setReason]        = useState("");
  const [isScanMode,    setIsScanMode]    = useState(false);

  const [resolvedPrice,  setResolvedPrice]  = useState<number | null>(null);
  const [resolvedTotal,  setResolvedTotal]  = useState<number | null>(null);
  const [isPriceChecking,setIsPriceChecking]= useState(false);
  const [priceError,     setPriceError]     = useState<string | null>(null);
  const priceCheckTimer                     = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── Search ──────────────────────────────────────────────
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSelectedItem(null);
    clearTimeout(searchTimer.current);
    if (!value.trim()) { setSearchResults([]); setShowDropdown(false); return; }
    setIsSearching(true);
    setShowDropdown(true);
    searchTimer.current = setTimeout(async () => {
      const results = await searchItems(value);
      setSearchResults(results);
      setIsSearching(false);
    }, 200);
  };

  const handleSelect = (item: ItemSearchResult) => {
    setSelectedItem(item);
    setSearchQuery(item.name);
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleClear = () => {
    setSelectedItem(null);
    setSearchQuery("");
    setQtyToRemove("");
    setReason("");
    setShowDropdown(false);
  };

  // ── Validation ───────────────────────────────────────────
  const qty         = Number(qtyToRemove);
  const canAdd      = selectedItem && qtyToRemove && reason && qty > 0 && resolvedPrice !== null && !priceError

  // ── Add item → pass back to parent via navigation state ─
  const handleAdd = () => {
    if (!canAdd || !selectedItem || !resolvedPrice || !resolvedTotal) return;
    const item: DispatchCartItem = {
      id:            selectedItem.id,
      itemName:      selectedItem.name,
      quantity:      qty,
      unitPrice:     resolvedPrice,
      stockQuantity: selectedItem.quantity,
      reason,
      total:         resolvedTotal,
    };
    navigate("/dispatch", {
      state: { newItem: item, existingCart },
    });
  };

  useEffect(() => {
  // Reset if no item selected or no qty entered
  if (!selectedItem || !qtyToRemove || Number(qtyToRemove) <= 0) {
    setResolvedPrice(null);
    setResolvedTotal(null);
    setPriceError(null);
    return;
  }

  clearTimeout(priceCheckTimer.current);
  setIsPriceChecking(true);
  setPriceError(null);

  priceCheckTimer.current = setTimeout(async () => {
    const token = localStorage.getItem("JORISA_TOKEN");
    try {
      const res = await fetch(
        `${Backend}/stock/price-check?item_id=${selectedItem.id}&quantity=${Number(qtyToRemove)}`,
        {
          headers: {
            "Authorization":              `Bearer ${token}`,
            "Content-Type":               "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        // This catches the "Only X units available" 400 from the backend
        setPriceError(err.detail || "Price check failed");
        setResolvedPrice(null);
        setResolvedTotal(null);
        return;
      }

      const data = await res.json();
      setResolvedPrice(data.resolved_selling_price);
      setResolvedTotal(data.total);
      setPriceError(null);
    } catch {
      setPriceError("Could not reach server");
    } finally {
      setIsPriceChecking(false);
    }
  }, 400); // 400ms debounce — waits for user to stop typing

  return () => clearTimeout(priceCheckTimer.current);
}, [selectedItem, qtyToRemove]);

  const label    = "text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block";
  const inputCls = "w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1B2B4B] placeholder:text-gray-300 focus:outline-none focus:border-[#0EA5A0] focus:ring-2 focus:ring-[#0EA5A0]/20 transition-all";

  return (
    <div className="w-full max-w-lg mx-auto pb-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate("/dispatch",{ state: { existingCart } })}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
          <ArrowLeft size={16} className="text-[#1B2B4B]" />
        </button>
        <div className="flex-1 bg-[#C8E8E8] rounded-2xl px-5 py-3 text-center">
          <h1 className="text-base font-bold text-[#1B2B4B]">Add items to checkout cart</h1>
        </div>
      </div>

      <div className="space-y-4">

        {/* Search */}
        <div>
          <label className={label}>Search item</label>
          <div className="relative">
            <div className="relative flex items-center">
              <Search size={15} className="absolute left-3 text-gray-400" />
              <input
                type="text"
                placeholder="Type item name to search..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                className={`${inputCls} pl-9 pr-9`}
              />
              <div className="absolute right-3">
                {isSearching ?(
                  <div className="w-4 h-4 border-2 border-[#0EA5A0]/30 border-t-[#0EA5A0] rounded-full animate-spin" />
                ) : searchQuery ? (
                  <button type="button" onClick={handleClear}><X size={14} className="text-gray-400" /></button>
                ) : null}
              </div>
            </div>
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {searchResults.length === 0 && !isSearching ? (
                  <div className="px-4 py-3 text-sm text-gray-400 text-center">No items found</div>
                ) : (
                  searchResults.map((item) => (
                    <button key={item.id} type="button" onClick={() => handleSelect(item)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F0FAFA] transition-colors border-b border-gray-50 last:border-0 text-left">
                      <div>
                        <p className="text-sm font-semibold text-[#1B2B4B]">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.category} · {item.barcode}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ml-3
                        ${item.quantity <= 5 ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500"}`}>
                        {item.quantity} in stock
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Barcode toggle */}
        <button type="button" onClick={() => setIsScanMode(!isScanMode)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#0EA5A0] transition-colors">
          <ScanBarcode size={14} />
          {isScanMode ? "Using barcode scanner — scan now" : "Use barcode scanner instead"}
        </button>
        {isScanMode && (
          <div className="bg-[#1B2B4B]/5 border border-[#1B2B4B]/10 rounded-xl px-4 py-3 text-xs text-[#1B2B4B]/60 text-center">
            Point scanner at barcode — item will auto-fill above
          </div>
        )}

        {/* Selected item pill */}
        {selectedItem && (
          <div className="flex items-center gap-3 bg-[#F0FAFA] border border-[#0EA5A0]/20 rounded-xl px-4 py-3">
            <div className="w-2 h-2 rounded-full bg-[#0EA5A0] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1B2B4B] truncate">{selectedItem.name}</p>
              <p className="text-xs text-gray-400">{selectedItem.category} · Ksh {selectedItem.unit_price} per unit</p>
            </div>
          </div>
        )}

        <div className="border-t border-gray-100" />

        {/* Qty row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Qty in inventory</label>
            <input type="number" readOnly
              value={selectedItem?.quantity ?? ""}
              placeholder="—"
              className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`}
            />
          </div>
          <div>
            <label className={label}>Qty to remove</label>
            <input
              type="number"
              placeholder="0"
              value={qtyToRemove}
              onChange={(e) => setQtyToRemove(e.target.value)}
              disabled={!selectedItem}
              min="1"
              className={`${inputCls}
              ${!selectedItem ? "bg-gray-50 text-gray-300 cursor-not-allowed" : ""}
              ${priceError    ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : ""}`}
          />
          {priceError && (
            <p className="text-xs text-red-500 mt-1">{priceError}</p>
          )}
        </div>
      </div>

        {/* Unit price — auto-filled, read-only */}
        <div>
          <label className={label}>Unit price (Ksh)</label>
          <div className="relative">
          <input
            type="number"
            readOnly
            value={resolvedPrice ?? ""}
            placeholder="Auto-filled from stock"
            className={`${inputCls} bg-gray-50 ${!resolvedPrice ? "text-gray-300" : "text-[#1B2B4B] font-semibold"}`}
          />
        </div>
        {isPriceChecking && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        <div className="w-4 h-4 border-2 border-[#0EA5A0]/30 border-t-[#0EA5A0] rounded-full animate-spin" />
      </div>
    )}
   </div>
   </div>

        {/* Reason for exit */}
        <div>
          <label className={label}>Reason for item exit</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={!selectedItem}
            className={`${inputCls} cursor-pointer
              ${!selectedItem ? "bg-gray-50 text-gray-300 cursor-not-allowed" : ""}`}
          >
            <option value="" disabled>Select reason...</option>
            {REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Summary */}
        {resolvedPrice && resolvedTotal && !priceError && (
  <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">Unit price (resolved)</span>
      <span className="text-sm font-bold text-[#1B2B4B]">Ksh {resolvedPrice.toLocaleString()}</span>
    </div>
    <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
      <span className="text-xs text-gray-500">Dispatch value</span>
      <span className="text-sm font-bold text-[#1B2B4B]">Ksh {resolvedTotal.toLocaleString()}</span>
    </div>
  </div>
)}

        {/* Add item */}
        <button onClick={handleAdd} disabled={!canAdd}
          className={`w-full h-12 rounded-2xl text-sm font-bold transition-all active:scale-[0.98]
            ${canAdd
              ? "bg-[#1B2B4B] text-white hover:bg-[#243a5e] shadow-md"
              : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}
        >
          Add item
        </button>
      </div>
    
  );
};

