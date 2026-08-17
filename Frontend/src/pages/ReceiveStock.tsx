// ── pages/ReceiveStockPage.tsx ───────────────────────────────
import { useState, useEffect, useCallback,useRef } from "react";
import { useNavigate, useLocation }         from "react-router-dom";
import { Plus, Trash2, ScanBarcode, PackagePlus ,Search,X} from "lucide-react";
//import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import type { CartItem }     from "../types/inventory";

import { toast } from "sonner";

// TODO: replace with real API call GET /items?barcode={code}
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


// ── Desktop inline add-item form ─────────────────────────────
interface InlineFormProps {
  onAdd: (item: CartItem) => void;
}

const InlineAddForm = ({ onAdd }: InlineFormProps) => {
  const [barcode,         setBarcode]         = useState("");
  const [itemName,        setItemName]        = useState("");
  const [unitPrice,       setUnitPrice]       = useState("");
  const [unitCost,        setUnitCost]        = useState("");
  const [quantityInStock, setQuantityInStock] = useState("");
  const [quantityToAdd,   setQuantityToAdd]   = useState("");
  


  const [isLooking,       setIsLooking]       = useState(false);
  
  const [selectedItem,    setSelectedItem]    = useState<ItemSearchResult | null>(null);
  const [isScanMode,      setIsScanMode]      = useState(false);

  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<ItemSearchResult[]>([]);
  const [isSearching,   setIsSearching]   = useState(false);
  const [showDropdown,  setShowDropdown]  = useState(false);
  const searchTimer                       = useRef<ReturnType<typeof setTimeout>>(undefined);
 
  const mockBarcodeLookup = async (code: string): Promise<ItemSearchResult | null> => {
  await new Promise((r) => setTimeout(r, 300));
  return { id: 1, name: "Bulb holders E27", barcode: code, category: "Electricals", quantity: 45 };
 };

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
      }, 300);
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
      setIsLooking(true);
      setIsScanMode(true);
      try {
        const result = await mockBarcodeLookup(code);
        if (result) {
          setSelectedItem(result);
          setSearchQuery(result.name);
        }
      } finally {
        setIsLooking(false);
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
     onAdd({
        id:        selectedItem.id,
        itemName:  selectedItem.name,
        quantity:  qty,
        unitCost:  cost,
        unitPrice: price,
        total:     qty * cost,
      });
        
    // Reset form
    setSelectedItem(null); setItemName(""); setSearchQuery(""); setUnitPrice("");setUnitCost("");
    setQuantityInStock(""); setQuantityToAdd("");
  };

  const label    = "text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block";
  const inputCls = "w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1B2B4B] placeholder:text-gray-300 focus:outline-none focus:border-[#0EA5A0] focus:ring-2 focus:ring-[#0EA5A0]/20 transition-all";

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 h-fit">
      <h2 className="text-sm font-bold text-[#1B2B4B]">Add individual item</h2>

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
                {isSearching || isLooking ? (
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

      {/* Unit price */}
      <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
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

        <div>
            <label className={label}>Unit Price (Ksh)</label>
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


      {/* Add button */}
      <button
        onClick={handleAdd}
        disabled={!canAdd}
        className={`w-full h-11 rounded-xl text-sm font-bold transition-all active:scale-[0.98]
          ${canAdd
            ? "bg-[#1B2B4B] text-white hover:bg-[#243a5e]"
            : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}
      >
        Add to list
      </button>
    </div>
   </div> 
  );
};

// ── Cart table ───────────────────────────────────────────────
interface CartTableProps {
  items:    CartItem[];
  onRemove: (id: number) => void;
  onQtyChange: (id: number, qty: number) => void;
}

const CartTable = ({ items, onRemove, onQtyChange }: CartTableProps) => {
  const grandTotal = items.reduce((s, i) => s + i.total, 0);
  

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <PackagePlus size={32} className="text-gray-200 mb-3" />
        <p className="text-sm text-gray-300 font-medium">No items added yet</p>
        <p className="text-xs text-gray-200">Scan a barcode or add items manually</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Id</th>
            <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Item name</th>
            <th className="text-center py-2.5 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Quantity</th>
            <th className="text-right py-2.5 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Unit Cost</th>
            <th className="text-right py-2.5 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
            <th className="py-2.5 px-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map((item, idx) => (
            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="py-3 px-2 text-gray-400 text-xs">{idx + 1}</td>
              <td className="py-3 px-2 font-medium text-[#1B2B4B]">{item.itemName}</td>
              <td className="py-3 px-2">
                {/* Inline qty stepper */}
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onQtyChange(item.id, Math.max(1, item.quantity - 1))}
                    className="w-6 h-6 rounded-lg bg-gray-100 text-[#1B2B4B] text-xs font-bold hover:bg-gray-200 transition-colors"
                  >−</button>
                  <span className="w-8 text-center text-sm font-semibold text-[#1B2B4B]">{item.quantity}</span>
                  <button
                    onClick={() =>onQtyChange(item.id, item.quantity + 1)}
                    className="w-6 h-6 rounded-lg bg-gray-100 text-[#1B2B4B] text-xs font-bold hover:bg-gray-200 transition-colors"
                  >+</button>
                </div>
              </td>
              <td className="py-3 px-2 text-right text-gray-500">Ksh {item.unitCost.toLocaleString()}</td>
              <td className="py-3 px-2 text-right font-semibold text-[#1B2B4B]">Ksh {item.total.toLocaleString()}</td>
              <td className="py-3 px-2 text-right">
                <button onClick={() => onRemove(item.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-100">
            <td colSpan={4} className="py-3 px-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Grand total</td>
            <td className="py-3 px-2 text-right font-bold text-[#1B2B4B]">Ksh {grandTotal.toLocaleString()}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────
export  const ReceiveStockPage = () => {
  const navigate          = useNavigate();
  const location          = useLocation();
  const [cart, setCart]   = useState<CartItem[]>([]);
  const [isCommitting, setIsCommitting] = useState(false);
  
  const processedStateRef = useRef<any>(null);

  // Pick up item returned from mobile sub-page
  useEffect(() => {
    if (location.state?.newItem && processedStateRef.current !== location.state.newItem) {
      processedStateRef.current = location.state.newItem;
      const incoming: CartItem = location.state.newItem;
      const baseCart: CartItem[] = location.state.existingCart || [];

      setCart(() => {
        // If same barcode already in cart, increase qty instead of duplicating
        const exists = baseCart.find((i) => i.id === incoming.id);
        if (exists) {
          return baseCart.map((i) =>
            i.id === incoming.id
              ? { ...i, quantity: i.quantity + incoming.quantity,
                 total: (i.quantity + incoming.quantity) * i.unitCost }
              : i
          );
        }
        return [...baseCart, incoming];
      });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state,navigate,location.pathname]);

  const addItem      = (item: CartItem) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + item.quantity, total: (i.quantity + item.quantity) * i.unitPrice }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeItem   = (id: number) => setCart((prev) => prev.filter((i) => i.id !== id));

  const changeQty    = (id: number, qty: number) =>
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, quantity: qty, total: qty * i.unitPrice } : i));

  const clearCart    = () => setCart([]);

  const handleCommit = async () => {
    if (cart.length === 0) return;

    const token = localStorage.getItem("JORISA_TOKEN");
    setIsCommitting(true);

    const grandTotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

    const payload = {
    total_amount: grandTotal,
    items: cart.map((item) => ({
      item_id: item.id,
      quantity: item.quantity,
      unit_cost: item.unitCost,
      unit_price: item.unitPrice,
    })),
  };

  try{
    const response= await fetch (`${Backend}/stock/receive`,{
      method:"POST",
      headers:{
        "Content-type":"application/json",
        "Authorization":`Bearer ${token}`,
        "ngrok-skip-browser-warning":"true",
      },
      body:JSON.stringify(payload)

    });
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.detail || "Failed to add stock");
    }

    toast.success("Stock added to inventory successfully!");
    clearCart();
    navigate("/inventory");
  }
  catch(error:any){
    toast.error(error.message || "Failed to commit the stock batch")
    }
  finally{
    setIsCommitting(false);
  }
  };

  return (
    <>
      {/* ══════════════════════════════════════
          MOBILE layout
      ══════════════════════════════════════ */}
      <div className="md:hidden w-full">

        {/* Title bar */}
        <div className="w-full bg-[#C8E8E8] rounded-2xl px-5 py-4 mb-5 text-center">
          <h1 className="text-lg font-bold text-[#1B2B4B]"> Items </h1>
        </div>

        {/* Cart label + clear */}
        <div className="flex items-center justify-between mb-3">
          
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">
              Clear cart
            </button>
          )}
        </div>

        {/* Cart table */}
        <div className="bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden">
          <CartTable items={cart} onRemove={removeItem} onQtyChange={changeQty} />
        </div>

        {/* Add item button → sub-page */}
        <button
          onClick={() => navigate("/receive/add",{ state: { currentCart: cart } })}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed
                     border-[#0EA5A0]/40 text-[#0EA5A0] text-sm font-semibold hover:bg-[#F0FAFA] transition-colors mb-4"
        >
          <Plus size={16} /> Add item
        </button>

        {/* Commit button */}
        <button
          onClick={handleCommit}
          disabled={cart.length === 0 || isCommitting}
          className={`w-full h-12 rounded-2xl text-sm font-bold transition-all active:scale-[0.98]
            ${cart.length > 0
              ? "bg-[#1B2B4B] text-white hover:bg-[#243a5e] shadow-md"
              : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}
        >
          {isCommitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Adding to inventory...
            </span>
          ) : "Add to inventory"}
        </button>
      </div>

      {/* ══════════════════════════════════════
          DESKTOP layout — two columns
      ══════════════════════════════════════ */}
      <div className="hidden md:grid md:grid-cols-[1fr_380px] md:gap-6 w-full">

  {/* LEFT — cart */}
  <div className="flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <div className="bg-[#C8E8E8] rounded-2xl px-5 py-3 flex-1 mr-4">
        <h1 className="text-base font-bold text-[#1B2B4B]"> Items </h1>
      </div>
      {cart.length > 0 && (
        <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors whitespace-nowrap">
          Clear cart
        </button>
      )}
    </div>

    <div className="bg-white rounded-2xl border border-gray-100 flex-1 overflow-hidden">
      <CartTable items={cart} onRemove={removeItem} onQtyChange={changeQty} />
    </div>

    <button
      onClick={handleCommit}
      disabled={cart.length === 0 || isCommitting}
      className={`w-full h-12 rounded-2xl text-sm font-bold transition-all active:scale-[0.98]
        ${cart.length > 0
          ? "bg-[#1B2B4B] text-white hover:bg-[#243a5e] shadow-md"
          : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}
    >
      {isCommitting ? (
        <span className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Adding to inventory...
        </span>
      ) : "Add to inventory"}
    </button>
  </div>

  {/* RIGHT — inline add form */}
  <InlineAddForm onAdd={addItem} />
</div>
    </>
  );
};
