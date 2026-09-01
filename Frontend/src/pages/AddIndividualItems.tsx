import { useState, useCallback, useRef } from "react";
import { useNavigate,useLocation } from "react-router-dom";
import { ArrowLeft, Search, ScanBarcode, X } from "lucide-react";
//import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import type { CartItem } from "../types/inventory";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────
interface ItemSearchResult {
  id:        number;
  name:      string;
  barcode:   string;
  category:  string;
  quantity:  number; // current stock
}

const Backend=import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"

 const searchItems = async (query: string): Promise<ItemSearchResult[]> => {

  const token = localStorage.getItem("JORISA_TOKEN");

  try{
   const response = await fetch(`${Backend}/items/search?query=${encodeURIComponent(query.trim())}`,{
    method:"GET",
    headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },});

    if (!response.ok) {
      const errorData = await response.json();
      toast.error("Search request failed")
      throw new Error(errorData.detail || "Search request failed");
      
    }
    const data: ItemSearchResult[] = await response.json();
    return data;
}
catch (error) {
    console.error("Item search error:", error);
    return [];
  }
};

// ── Mock barcode lookup — replace with GET /items?barcode={code}
const mockBarcodeLookup = async (code: string): Promise<ItemSearchResult | null> => {
  await new Promise((r) => setTimeout(r, 300));
  return { id: 1, name: "Bulb holders E27", barcode: code, category: "Electricals", quantity: 45 };
};

export const AddIndividualItemPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const existingCart: CartItem[] = location.state?.currentCart || [];
  

  // Search state
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<ItemSearchResult[]>([]);
  const [isSearching,   setIsSearching]   = useState(false);
  const [showDropdown,  setShowDropdown]  = useState(false);
  const searchTimer                       = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Selected item state
  const [selectedItem,    setSelectedItem]    = useState<ItemSearchResult | null>(null);
  const [unitCost,        setUnitCost]        = useState("");
  const [unitPrice,       setUnitPrice]       = useState("");
  const [quantityToAdd,   setQuantityToAdd]   = useState("");
  const [isScanMode,      setIsScanMode]      = useState(false);
  const [isLookingUp,     setIsLookingUp]     = useState(false);

  // ── Live search with debounce ─────────────────────────────
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSelectedItem(null);
    clearTimeout(searchTimer.current);

    if (!value.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);
    searchTimer.current = setTimeout(async () => {
      const results = await searchItems(value);
      setSearchResults(results);
      setIsSearching(false);
    }, 200);
  };

  // ── Select from dropdown ──────────────────────────────────
  const handleSelect = (item: ItemSearchResult) => {
    setSelectedItem(item);
    setSearchQuery(item.name);
    setShowDropdown(false);
    setSearchResults([]);
  };

  // ── Clear selection ───────────────────────────────────────
  const handleClear = () => {
    setSelectedItem(null);
    setSearchQuery("");
    setUnitCost("");
    setUnitPrice("");
    setQuantityToAdd("");
    setShowDropdown(false);
  };

  // ── Barcode scanner fallback ──────────────────────────────
  const handleScan = useCallback(async (code: string) => {
    setIsLookingUp(true);
    setIsScanMode(true);
    try {
      const result = await mockBarcodeLookup(code);
      if (result) {
        setSelectedItem(result);
        setSearchQuery(result.name);
      }
    } finally {
      setIsLookingUp(false);
    }
  }, []);

  //useBarcodeScanner(handleScan);

  // ── Add to cart ───────────────────────────────────────────
  const canAdd = selectedItem && quantityToAdd && unitCost && unitPrice;

  const handleAdd = () => {
    if (!canAdd || !selectedItem) return;
    const qty   = Number(quantityToAdd);
    const price = Number(unitPrice);
    const cost  = Number(unitCost);
    const item: CartItem = {
      id:        selectedItem.id,
      itemName:  selectedItem.name,
      quantity:  qty,
      unitCost:  cost,
      unitPrice: price,
      total:     qty * cost,
    };
    navigate("/receive", { state: { newItem: item,existingCart: existingCart, } });
  };

  const label    = "text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block";
  const inputCls = "w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1B2B4B] placeholder:text-gray-300 focus:outline-none focus:border-[#0EA5A0] focus:ring-2 focus:ring-[#0EA5A0]/20 transition-all";

  return (
    <div className="w-full max-w-lg mx-auto pt-4 px-4 pb-24">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate("/receive",{ state: { existingCart } })}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
          <ArrowLeft size={16} className="text-[#1B2B4B]" />
        </button>
        <div className="flex-1 bg-[#C8E8E8] rounded-2xl px-5 py-3 text-center">
          <h1 className="text-base font-bold text-[#1B2B4B]">Add individual items</h1>
        </div>
      </div>

      <div className="space-y-4">

        {/* ── Search input ── */}
        <div>
          <label className={label}>Search item</label>
          <div className="relative">
            <div className="relative flex items-center">
              <Search size={15} className="absolute left-3 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Type item name to search..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                className={`${inputCls} pl-9 pr-9`}
              />
              {/* Clear / loading indicator */}
              <div className="absolute right-3">
                {isSearching || isLookingUp ? (
                  <div className="w-4 h-4 border-2 border-[#0EA5A0]/30 border-t-[#0EA5A0] rounded-full animate-spin" />
                ) : searchQuery ? (
                  <button type="button" onClick={handleClear}>
                    <X size={14} className="text-gray-400 hover:text-gray-600" />
                  </button>
                ) : null}
              </div>
            </div>

            {/* Dropdown results */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {searchResults.length === 0 && !isSearching ? (
                  <div className="px-4 py-3 text-sm text-gray-400 text-center">
                    No items found — check spelling or register item first
                  </div>
                ) : (
                  searchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F0FAFA] transition-colors border-b border-gray-50 last:border-0 text-left"
                    >
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

        {/* ── Selected item info pill ── */}
        {selectedItem && (
          <div className="flex items-center gap-3 bg-[#F0FAFA] border border-[#0EA5A0]/20 rounded-xl px-4 py-3">
            <div className="w-2 h-2 rounded-full bg-[#0EA5A0] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1B2B4B] truncate">{selectedItem.name}</p>
              <p className="text-xs text-gray-400">{selectedItem.category} · Current stock: {selectedItem.quantity}</p>
            </div>
          </div>
        )}

        {/* ── Barcode scan toggle ── */}
        <button
          type="button"
          onClick={() => setIsScanMode(!isScanMode)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#0EA5A0] transition-colors"
        >
          <ScanBarcode size={14} />
          {isScanMode ? "Using barcode scanner — scan now" : "Use barcode scanner instead"}
        </button>

        {isScanMode && (
          <div className="bg-[#1B2B4B]/5 border border-[#1B2B4B]/10 rounded-xl px-4 py-3 text-xs text-[#1B2B4B]/60 text-center">
            Point scanner at barcode — item will auto-fill above
          </div>
        )}

        <div className="border-t border-gray-100" />

        {/* ── Unit cost + Unit price ── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Unit cost (Ksh)</label>
            <input
              type="number"
              placeholder="0.00"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              disabled={!selectedItem}
              min="0"
              className={`${inputCls} ${!selectedItem ? "bg-gray-50 text-gray-300 cursor-not-allowed" : ""}`}
            />
          </div>
          <div>
            <label className={label}>Unit price (Ksh)</label>
            <input
              type="number"
              placeholder="0.00"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              disabled={!selectedItem}
              min="0"
              className={`${inputCls} ${!selectedItem ? "bg-gray-50 text-gray-300 cursor-not-allowed" : ""}`}
            />
          </div>
        </div>

        {/* ── Quantity to add ── */}
        <div>
          <label className={label}>Quantity to add</label>
          <input
            type="number"
            placeholder="0"
            value={quantityToAdd}
            onChange={(e) => setQuantityToAdd(e.target.value)}
            disabled={!selectedItem}
            min="1"
            className={`${inputCls} ${!selectedItem ? "bg-gray-50 text-gray-300 cursor-not-allowed" : ""}`}
          />
        </div>

        {/* ── Summary preview ── */}
        {canAdd && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">Stock value being added</span>
            <span className="text-sm font-bold text-[#1B2B4B]">
              Ksh {(Number(quantityToAdd) * Number(unitCost)).toLocaleString()}
            </span>
          </div>
        )}

        {/* ── Add item button ── */}
        <button
          onClick={handleAdd}
          disabled={!canAdd}
          className={`w-full h-12 rounded-2xl text-sm font-bold transition-all active:scale-[0.98]
            ${canAdd
              ? "bg-[#1B2B4B] text-white hover:bg-[#243a5e] shadow-md"
              : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}
        >
          Add item
        </button>
      </div>
    </div>
  );
};
