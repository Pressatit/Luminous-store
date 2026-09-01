import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation }    from "react-router-dom";
import { Plus, Trash2, Search, X,
         PackageMinus, Printer, ShoppingCart } from "lucide-react";
import { toast }                               from "sonner";
import type { DispatchCartItem }               from "../types/dispatch";

const Backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
const REASONS = ["Sale", "Spoilt", "Internal use"];

interface ItemSearchResult {
  id:         number;
  name:       string;
  barcode:    string;
  category:   string;
  quantity:   number;
  unit_price: number;
}

const searchItems = async (query: string): Promise<ItemSearchResult[]> => {
  const token = localStorage.getItem("JORISA_TOKEN");
  try {
    const res = await fetch(
      `${Backend}/items/search?query=${encodeURIComponent(query.trim())}`,
      { headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" } }
    );
    if (!res.ok) throw new Error();
    return await res.json();
  } catch { return []; }
};

// ── Confirmation modal ───────────────────────────────────────
interface ConfirmModalProps {
  cart:      DispatchCartItem[];
  onConfirm: () => void;
  onCancel:  () => void;
  isLoading: boolean;
}

const ConfirmModal = ({ cart, onConfirm, onCancel, isLoading }: ConfirmModalProps) => {
  const grandTotal = cart.reduce((s, i) => s + i.total, 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-base font-bold text-[#1B2B4B] mb-1">Confirm checkout</h2>
        <p className="text-xs text-gray-400 mb-4">
          This will permanently remove these items from inventory and record the transaction.
        </p>
        <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1.5 max-h-48 overflow-y-auto">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#1B2B4B]">{item.itemName}</p>
                <p className="text-xs text-gray-400">{item.quantity} units · {item.reason}</p>
              </div>
              <p className="text-xs font-bold text-[#1B2B4B]">Ksh {item.total.toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mb-5 px-1">
          <span className="text-sm font-semibold text-gray-500">Total</span>
          <span className="text-base font-bold text-[#1B2B4B]">Ksh {grandTotal.toLocaleString()}</span>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={isLoading}
            className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isLoading}
            className="flex-1 h-11 rounded-xl bg-[#0EA5A0] text-white text-sm font-bold hover:bg-[#0c9490] transition-colors flex items-center justify-center gap-2">
            {isLoading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><ShoppingCart size={14} /> Confirm</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Desktop inline add form — with price-check API ───────────
interface InlineDispatchFormProps {
  onAdd: (item: DispatchCartItem) => void;
}

const InlineDispatchForm = ({ onAdd }: InlineDispatchFormProps) => {
  const [searchQuery,    setSearchQuery]    = useState("");
  const [searchResults,  setSearchResults]  = useState<ItemSearchResult[]>([]);
  const [isSearching,    setIsSearching]    = useState(false);
  const [showDropdown,   setShowDropdown]   = useState(false);
  const [selectedItem,   setSelectedItem]   = useState<ItemSearchResult | null>(null);
  const [qtyToRemove,    setQtyToRemove]    = useState("");
  const [reason,         setReason]         = useState("");
  const [resolvedPrice,  setResolvedPrice]  = useState<number | null>(null);
  const [resolvedTotal,  setResolvedTotal]  = useState<number | null>(null);
  const [isPriceChecking,setIsPriceChecking]= useState(false);
  const [priceError,     setPriceError]     = useState<string | null>(null);
  const searchTimer                         = useRef<ReturnType<typeof setTimeout>>(undefined);
  const priceCheckTimer                     = useRef<ReturnType<typeof setTimeout>>(undefined);

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
    setResolvedPrice(null);
    setResolvedTotal(null);
    setPriceError(null);
    setQtyToRemove("");
  };

  const handleClear = () => {
    setSelectedItem(null);
    setSearchQuery("");
    setQtyToRemove("");
    setReason("");
    setResolvedPrice(null);
    setResolvedTotal(null);
    setPriceError(null);
  };

  // ── Price check effect ──────────────────────────────────
  useEffect(() => {
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
          { headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" } }
        );
        if (!res.ok) {
          const err = await res.json();
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
    }, 400);

    return () => clearTimeout(priceCheckTimer.current);
  }, [selectedItem, qtyToRemove]);

  const qty    = Number(qtyToRemove);
  const canAdd = selectedItem && qty > 0 && reason && resolvedPrice !== null && !priceError && !isPriceChecking;

  const handleAdd = () => {
    if (!canAdd || !selectedItem || !resolvedPrice || !resolvedTotal) return;
    onAdd({
      id:            selectedItem.id,
      itemName:      selectedItem.name,
      quantity:      qty,
      unitPrice:     resolvedPrice,
      stockQuantity: selectedItem.quantity,
      reason,
      total:         resolvedTotal,
    });
    handleClear();
  };

  const label    = "text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block";
  const inputCls = "w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1B2B4B] placeholder:text-gray-300 focus:outline-none focus:border-[#0EA5A0] focus:ring-2 focus:ring-[#0EA5A0]/20 transition-all";

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 h-fit sticky top-4">
      <h2 className="text-sm font-bold text-[#1B2B4B]">Add item to cart</h2>

      {/* Search */}
      <div>
        <label className={label}>Search item</label>
        <div className="relative">
          <div className="relative flex items-center">
            <Search size={15} className="absolute left-3 text-gray-400" />
            <input type="text" placeholder="Type item name..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              className={`${inputCls} pl-9 pr-9`}
            />
            <div className="absolute right-3">
              {isSearching
                ? <div className="w-4 h-4 border-2 border-[#0EA5A0]/30 border-t-[#0EA5A0] rounded-full animate-spin" />
                : searchQuery
                ? <button type="button" onClick={handleClear}><X size={14} className="text-gray-400" /></button>
                : null}
            </div>
          </div>
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
              {searchResults.length === 0 && !isSearching
                ? <div className="px-4 py-3 text-sm text-gray-400 text-center">No items found</div>
                : searchResults.map((item) => (
                    <button key={item.id} type="button" onClick={() => handleSelect(item)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F0FAFA] transition-colors border-b border-gray-50 last:border-0 text-left">
                      <div>
                        <p className="text-sm font-semibold text-[#1B2B4B]">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.category}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ml-3
                        ${item.quantity <= 5 ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500"}`}>
                        {item.quantity} in stock
                      </span>
                    </button>
                  ))
              }
            </div>
          )}
        </div>
      </div>

      {/* Selected pill */}
      {selectedItem && (
        <div className="flex items-center gap-3 bg-[#F0FAFA] border border-[#0EA5A0]/20 rounded-xl px-4 py-3">
          <div className="w-2 h-2 rounded-full bg-[#0EA5A0] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1B2B4B] truncate">{selectedItem.name}</p>
            <p className="text-xs text-gray-400">{selectedItem.quantity} in stock · {selectedItem.category}</p>
          </div>
        </div>
      )}

      <div className="border-t border-gray-100" />

      {/* Qty row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>In stock</label>
          <input type="number" readOnly value={selectedItem?.quantity ?? ""} placeholder="—"
            className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`} />
        </div>
        <div>
          <label className={label}>Qty to remove</label>
          <input type="number" min="1" value={qtyToRemove} placeholder="0"
            onChange={(e) => setQtyToRemove(e.target.value)}
            disabled={!selectedItem}
            className={`${inputCls}
              ${!selectedItem ? "bg-gray-50 text-gray-300 cursor-not-allowed" : ""}
              ${priceError    ? "border-red-400" : ""}`}
          />
          {priceError && <p className="text-xs text-red-500 mt-1">{priceError}</p>}
        </div>
      </div>

      {/* Unit price — resolved from price-check */}
      <div>
        <label className={label}>Unit price (Ksh)</label>
        <div className="relative">
          <input type="number" readOnly value={resolvedPrice ?? ""} placeholder="Enter quantity to calculate..."
            className={`${inputCls} bg-gray-50 pr-9
              ${!resolvedPrice ? "text-gray-300" : "text-[#1B2B4B] font-semibold"}`}
          />
          {isPriceChecking && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-[#0EA5A0]/30 border-t-[#0EA5A0] rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className={label}>Reason for exit</label>
        <select value={reason} onChange={(e) => setReason(e.target.value)}
          disabled={!selectedItem}
          className={`${inputCls} cursor-pointer ${!selectedItem ? "bg-gray-50 text-gray-300 cursor-not-allowed" : ""}`}>
          <option value="" disabled>Select reason...</option>
          {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
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

      <button onClick={handleAdd} disabled={!canAdd}
        className={`w-full h-11 rounded-xl text-sm font-bold transition-all active:scale-[0.98]
          ${canAdd ? "bg-[#1B2B4B] text-white hover:bg-[#243a5e]" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}>
        {isPriceChecking
          ? <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300/40 border-t-gray-400 rounded-full animate-spin" />
              Checking price...
            </span>
          : "Add to cart"
        }
      </button>
    </div>
  );
};

// ── Cart table ───────────────────────────────────────────────
interface CartTableProps {
  items:       DispatchCartItem[];
  onRemove:    (id: number) => void;
  onQtyChange: (id: number, qty: number) => void;
}

const DispatchCartTable = ({ items, onRemove, onQtyChange }: CartTableProps) => {
  const grandTotal = items.reduce((s, i) => s + i.total, 0);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <PackageMinus size={32} className="text-gray-200 mb-3" />
        <p className="text-sm text-gray-300 font-medium">No items added yet</p>
        <p className="text-xs text-gray-200">Search for items to dispatch</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {["#","Item name","Qty","Unit price","Reason","Total",""].map((h) => (
              <th key={h} className={`py-2.5 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider
                ${h === "Total" || h === "Unit price" ? "text-right" : h === "Qty" ? "text-center" : "text-left"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map((item, idx) => (
            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="py-3 px-2 text-gray-400 text-xs">{idx + 1}</td>
              <td className="py-3 px-2 font-medium text-[#1B2B4B]">{item.itemName}</td>
              <td className="py-3 px-2">
                <div className="flex items-center justify-center gap-1">
                  <button onClick={() => onQtyChange(item.id, Math.max(1, item.quantity - 1))}
                    className="w-6 h-6 rounded-lg bg-gray-100 text-[#1B2B4B] text-xs font-bold hover:bg-gray-200 transition-colors">−</button>
                  <span className="w-8 text-center text-sm font-semibold text-[#1B2B4B]">{item.quantity}</span>
                  <button
                    onClick={() => {
                      if (item.quantity >= item.stockQuantity) {
                        toast.warning(`Max stock available: ${item.stockQuantity}`);
                        return;
                      }
                      onQtyChange(item.id, item.quantity + 1);
                    }}
                    className="w-6 h-6 rounded-lg bg-gray-100 text-[#1B2B4B] text-xs font-bold hover:bg-gray-200 transition-colors">+</button>
                </div>
              </td>
              <td className="py-3 px-2 text-right text-gray-500">Ksh {item.unitPrice.toLocaleString()}</td>
              <td className="py-3 px-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                  ${item.reason === "Sale"   ? "bg-green-50 text-green-600"
                  : item.reason === "Spoilt" ? "bg-red-50 text-red-500"
                  :                           "bg-blue-50 text-blue-600"}`}>
                  {item.reason}
                </span>
              </td>
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
            <td colSpan={5} className="py-3 px-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Grand total</td>
            <td className="py-3 px-2 text-right font-bold text-[#1B2B4B]">Ksh {grandTotal.toLocaleString()}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

// ── Main dispatch page ───────────────────────────────────────
export const DispatchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [cart,         setCart]         = useState<DispatchCartItem[]>([]);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const processedStateRef               = useRef<any>(null);

  // ── Pick up item from mobile sub-page + handle back button
  useEffect(() => {
    const incomingItem:  DispatchCartItem | undefined  = location.state?.newItem;
    const restoredCart:  DispatchCartItem[] | undefined = location.state?.existingCart;

    if (incomingItem && processedStateRef.current !== incomingItem) {
      processedStateRef.current = incomingItem;
      const baseCart = restoredCart ?? cart;

      setCart(() => {
        const exists = baseCart.find((i) => i.id === incomingItem.id);
        if (exists) {
          const clampedQty = Math.min(exists.quantity + incomingItem.quantity, incomingItem.stockQuantity);
          return baseCart.map((i) =>
            i.id === incomingItem.id
              ? { ...i, quantity: clampedQty, total: clampedQty * i.unitPrice }
              : i
          );
        }
        return [...baseCart, incomingItem];
      });
      navigate(location.pathname, { replace: true, state: {} });

    } else if (!incomingItem && restoredCart && restoredCart.length > 0) {
      // Back button pressed — just restore the cart
      setCart(restoredCart);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const addItem = (item: DispatchCartItem) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        const clampedQty = Math.min(exists.quantity + item.quantity, item.stockQuantity);
        if (exists.quantity + item.quantity > item.stockQuantity)
          toast.warning(`Clamped to max stock: ${item.stockQuantity}`);
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: clampedQty, total: clampedQty * i.unitPrice } : i
        );
      }
      return [...prev, item];
    });
  };

  const removeItem = (id: number) => setCart((prev) => prev.filter((i) => i.id !== id));
  const changeQty  = (id: number, qty: number) =>
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, quantity: qty, total: qty * i.unitPrice } : i));
  const clearCart  = () => setCart([]);

  // ── Print quotation ───────────────────────────────────────
  const handlePrintQuotation = () => {
    if (cart.length === 0) return;
    const grandTotal = cart.reduce((s, i) => s + i.total, 0);
    const rows = cart.map((item, idx) =>
      `<tr>
        <td>${idx + 1}</td><td>${item.itemName}</td><td>${item.quantity}</td>
        <td>Ksh ${item.unitPrice.toLocaleString()}</td><td>${item.reason}</td>
        <td>Ksh ${item.total.toLocaleString()}</td>
      </tr>`
    ).join("");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Quotation — Jorisa Electrical</title>
      <style>
        body{font-family:sans-serif;padding:32px;color:#1B2B4B}
        h1{font-size:20px;margin-bottom:4px}p{font-size:13px;color:#666;margin-bottom:24px}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th{text-align:left;padding:8px 12px;background:#f8fafc;border-bottom:2px solid #e2e8f0;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
        td{padding:10px 12px;border-bottom:1px solid #f1f5f9}
        .total{font-weight:bold;font-size:15px;text-align:right;margin-top:16px}
        @media print{button{display:none}}
      </style></head>
      <body>
        <h1>Jorisa Electrical & Hardware</h1>
        <p>Quotation · ${new Date().toLocaleDateString("en-KE", { dateStyle: "long" })}</p>
        <table>
          <thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Unit price</th><th>Reason</th><th>Total</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="total">Grand Total: Ksh ${grandTotal.toLocaleString()}</p>
        <button onclick="window.print()" style="margin-top:24px;padding:10px 20px;background:#1B2B4B;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px;">Print</button>
      </body></html>
    `);
    win.document.close();
  };

  // ── Confirm checkout ──────────────────────────────────────
  const handleConfirmCheckout = async () => {
    const token      = localStorage.getItem("JORISA_TOKEN");
    const grandTotal = cart.reduce((s, i) => s + i.total, 0);
    setIsCommitting(true);

    const payload = {
      total_amount: grandTotal,
      items: cart.map((item) => ({
        item_id:       item.id,
        quantity:      item.quantity,
        selling_price: item.unitPrice,
        reason:        item.reason,
      })),
    };

    try {
      const res = await fetch(`${Backend}/stock/dispatch`, {
        method:  "POST",
        headers: {
          "Content-Type":               "application/json",
          "Authorization":              `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Checkout failed");
      }
      toast.success("Checkout complete — stock updated!");
      clearCart();
      setShowConfirm(false);
      navigate("/inventory");
    } catch (err: any) {
      toast.error(err.message || "Checkout failed");
    } finally {
      setIsCommitting(false);
    }
  };

  // ── Action buttons (shared mobile + desktop) ──────────────
  const ActionButtons = () => (
    <div className="flex gap-3">
      <button
        onClick={handlePrintQuotation}
        disabled={cart.length === 0}
        className={`flex items-center justify-center gap-2 h-12 px-5 rounded-2xl text-sm font-bold
                    border-2 transition-all active:scale-[0.98]
                    ${cart.length > 0
                      ? "border-[#1B2B4B] text-[#1B2B4B] hover:bg-gray-50"
                      : "border-gray-200 text-gray-300 cursor-not-allowed"}`}
      >
        <Printer size={15} /> Print quotation
      </button>
      <button
        onClick={() => cart.length > 0 && setShowConfirm(true)}
        disabled={cart.length === 0}
        className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl text-sm font-bold
                    transition-all active:scale-[0.98]
                    ${cart.length > 0
                      ? "bg-[#0EA5A0] text-white hover:bg-[#0c9490] shadow-lg shadow-[#0EA5A0]/25"
                      : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}
      >
        <ShoppingCart size={15} /> Checkout
      </button>
    </div>
  );

  return (
    <>
      {/* ══════════════════════════════════════
          MOBILE
      ══════════════════════════════════════ */}
      <div className="md:hidden w-full">

        <div className="w-full bg-[#C8E8E8] rounded-2xl px-5 py-4 mb-5 text-center">
          <h1 className="text-lg font-bold text-[#1B2B4B]"> items</h1>
        </div>

        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Items</p>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">
              Clear cart
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden">
          <DispatchCartTable items={cart} onRemove={removeItem} onQtyChange={changeQty} />
        </div>

        <button
          onClick={() => navigate("/dispatch/add", { state: { currentCart: cart } })}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed
                     border-[#0EA5A0]/40 text-[#0EA5A0] text-sm font-semibold hover:bg-[#F0FAFA] transition-colors mb-4"
        >
          <Plus size={16} /> Add item
        </button>

        <ActionButtons />
      </div>

      {/* ══════════════════════════════════════
          DESKTOP — two columns
      ══════════════════════════════════════ */}
      <div className="hidden md:grid md:grid-cols-[1fr_380px] md:gap-6 w-full">

        {/* LEFT — cart */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="bg-[#C8E8E8] rounded-2xl px-5 py-3 flex-1 mr-4">
              <h1 className="text-base font-bold text-[#1B2B4B]">Checkout items</h1>
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors whitespace-nowrap">
                Clear cart
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 flex-1 overflow-hidden">
            <DispatchCartTable items={cart} onRemove={removeItem} onQtyChange={changeQty} />
          </div>

          <ActionButtons />
        </div>

        {/* RIGHT — inline form with price-check */}
        <InlineDispatchForm onAdd={addItem} />
      </div>

      {/* ── Confirmation modal ── */}
      {showConfirm && (
        <ConfirmModal
          cart={cart}
          onConfirm={handleConfirmCheckout}
          onCancel={() => setShowConfirm(false)}
          isLoading={isCommitting}
        />
      )}
    </>
  );
};

