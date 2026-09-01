import { useState, useMemo, useCallback } from "react";
import { Download, FileBarChart, ArrowDown, ArrowUp, Minus } from "lucide-react";
import { DateRangePicker, type DateRange } from "../components/report/DatePicker";
import type { ReportRow } from "../types/report";

const Backend = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

// ── Today and yesterday as default range ─────────────────────
const today = () => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};

const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

// ── Transaction type badge ────────────────────────────────────
const TrTypeBadge = ({ type }: { type: string }) => {
  const isReceive  = type.toLowerCase().includes("receive");
  const isDispatch = type.toLowerCase().includes("dispatch") || type.toLowerCase().includes("sale");

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full
      ${isReceive  ? "bg-green-50 text-green-600"
      : isDispatch ? "bg-red-50   text-red-500"
      :              "bg-gray-100 text-gray-500"}`}
    >
      {isReceive  ? <ArrowDown size={10} /> : isDispatch ? <ArrowUp size={10} /> : <Minus size={10} />}
      {type}
    </span>
  );
};

export const ReportPage = () => {
  // Default range: yesterday → today
  const [dateRange, setDateRange] = useState<DateRange>({
    from: yesterday(),
    to:   today(),
  });

  const [rows,      setRows]      = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetched,   setFetched]   = useState(false); // true after first fetch
  const [error,     setError]     = useState<string | null>(null);

  // ── Fetch report ──────────────────────────────────────────
  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("JORISA_TOKEN");
    try {
      const res = await fetch(
        `${Backend}/report?date_from=${dateRange.from}&date_to=${dateRange.to}`,
        {
          headers: {
            "Authorization":              `Bearer ${token}`,
            "Content-Type":               "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }
      );
      if (!res.ok) throw new Error("Failed to load report");
      const data: ReportRow[] = await res.json();
      setRows(data);
      setFetched(true);
    } catch (err) {
      setError("Could not load report. Check your connection.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  // ── Summary stats derived from rows ──────────────────────
  // useMemo so they only recalculate when rows changes
  const summary = useMemo(() => {
    const totalIn  = rows.filter(r => r.transaction_type.toLowerCase().includes("receive"))
                         .reduce((s, r) => s + r.quantity, 0);
    const totalOut = rows.filter(r => !r.transaction_type.toLowerCase().includes("receive"))
                         .reduce((s, r) => s + r.quantity, 0);
    const totalValue = rows.reduce((s, r) => s + r.total_amount, 0);
    return { totalIn, totalOut, totalValue };
  }, [rows]);

  // ── Download as CSV ───────────────────────────────────────
  const handleDownload = () => {
    if (rows.length === 0) return;

    const headers = ["Id","Item name","Quantity","Served by","Date","Time","Type","Total"];
    const csvRows = rows.map(r =>
      [r.id, r.item_name, r.quantity, r.served_by, r.date, r.time,
       r.transaction_type, r.total_amount].join(",")
    );
    const csv  = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `jorisa-report-${dateRange.from}-to-${dateRange.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full pb-6">

      {/* ── Page title ── */}
      <div className="w-full bg-[#FFFFFF] rounded-2xl px-5 py-4 mb-5 text-center md:text-left">
        
      </div>

      {/* ── Date range picker ── */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Date range
        </p>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* ── Fetch button ── */}
      <button
        onClick={fetchReport}
        disabled={isLoading}
        className={`w-full sm:w-auto h-10 px-6 rounded-xl text-sm font-bold mb-5
                    flex items-center justify-center gap-2 transition-all active:scale-[0.98]
                    ${isLoading
                      ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                      : "bg-[#1B2B4B] text-white hover:bg-[#243a5e] shadow-md"}`}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <FileBarChart size={15} />
            Generate report
          </>
        )}
      </button>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
          <p className="text-sm text-red-500 font-medium">{error}</p>
        </div>
      )}

      {/* ── Summary cards — only shown after fetch ── */}
      {fetched && !isLoading && (
        <div className="grid grid-cols-2 gap-2 mb-5">
          {[
            { label: "Units in",    value: summary.totalIn,                       color: "text-green-600", bg: "bg-green-50"  },
            { label: "Units out",   value: summary.totalOut,                      color: "text-red-500",   bg: "bg-red-50"    },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-2xl px-3 py-3 text-center`}>
              <p className={`text-base font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Transactions table ── */}
      {fetched && !isLoading && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Transactions
              {rows.length > 0 && (
                <span className="ml-2 text-[#1B2B4B] normal-case">{rows.length} rows</span>
              )}
            </p>
          </div>

          {rows.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl flex flex-col
                            items-center justify-center py-16 text-center">
              <FileBarChart size={28} className="text-gray-200 mb-3" />
              <p className="text-sm font-semibold text-gray-400">No transactions in this date range</p>
              <p className="text-xs text-gray-300 mt-1">Try adjusting the From / To dates</p>
            </div>
          ) : (
            <>
              {/* ── MOBILE: card list ── */}
              <div className="md:hidden space-y-3">
                {rows.map((row, idx) => (
                  <div key={row.id}
                    className="bg-white border border-gray-100 rounded-2xl px-4 py-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#1B2B4B]">{row.item_name}</p>
                        <p className="text-xs text-gray-400">{row.served_by} · {row.date} {row.time}</p>
                      </div>
                      <TrTypeBadge type={row.transaction_type} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Qty: <span className="font-semibold text-[#1B2B4B]">{row.quantity}</span></span>
                      <span className="text-xs text-gray-400">Total: <span className="font-semibold text-[#1B2B4B]">Ksh {row.total_amount.toLocaleString()}</span></span>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── DESKTOP: full table ── */}
              <div className="hidden md:block bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/60">
                        {["Id","Item name","Quantity","Served by","Date","Time","Type","Total"].map((h) => (
                          <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {rows.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4 text-gray-400 text-xs">{row.id}</td>
                          <td className="py-3 px-4 font-medium text-[#1B2B4B] whitespace-nowrap">{row.item_name}</td>
                          <td className="py-3 px-4 text-center font-semibold text-[#1B2B4B]">{row.quantity}</td>
                          <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{row.served_by}</td>
                          <td className="py-3 px-4 text-gray-400 whitespace-nowrap">{row.date}</td>
                          <td className="py-3 px-4 text-gray-400">{row.time}</td>
                          <td className="py-3 px-4"><TrTypeBadge type={row.transaction_type} /></td>
                          <td className="py-3 px-4 font-bold text-[#1B2B4B] whitespace-nowrap">Ksh {row.total_amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── Download button ── */}
          {rows.length > 0 && (
            <div className="flex justify-end mt-4">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 h-11 px-5 rounded-2xl
                           bg-[#1B2B4B] text-white text-sm font-bold
                           hover:bg-[#243a5e] active:scale-[0.98] transition-all shadow-md"
              >
                <Download size={15} />
                Download Report
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
