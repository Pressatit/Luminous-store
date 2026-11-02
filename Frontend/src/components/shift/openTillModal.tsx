import { useState } from "react";
import { Zap, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useShift } from "../../context/shiftcontext";
import type { Openshift } from "../../types/shift";

const Backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface OpenTillModalProps {
  onShiftOpened: () => void; // called when shift successfully opened
}

export const OpenTillModal = ({ onShiftOpened }: OpenTillModalProps) => {
  const { setActiveShift } = useShift();

  const [openingBalance, setOpeningBalance] = useState("");
  const [isOpening,      setIsOpening]      = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  const [cashiername, setCashiername] = useState(() => {
  const userStr = localStorage.getItem("JORISA_USER");
  return userStr ? JSON.parse(userStr).name : "Cashier";
});

const [storename, setStoreName] = useState(() => {
  return localStorage.getItem("STORE_NAME") || "Hardware Store";
});

  const handleOpenTill = async () => {
    if (!openingBalance || Number(openingBalance) < 0) {
      setError("Please enter a valid opening balance");
      return;
    }

    setIsOpening(true);
    setError(null);
    const token = localStorage.getItem("JORISA_TOKEN");

    try {
      const res = await fetch(
        `${Backend}/shifts/open?opening_balance=${Number(openingBalance)}`,
        {
          method:  "POST",
          headers: {
            "Authorization":              `Bearer ${token}`,
            "Content-Type":               "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to open shift");
      }

      const data: Openshift = await res.json();
      setActiveShift(data);
      setCashiername(data.cashier_name);
      setStoreName(data.store_name)
      toast.success(`Till opened — good shift, ${data.cashier_name}!`);
      onShiftOpened();

    } catch (err: any) {
      setError(err.message || "Could not open till. Try again.");
    } finally {
      setIsOpening(false);
    }
  };

  const formatTime = () =>
    new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* ── Full screen blur backdrop — cannot be dismissed ── */}
      <div className="fixed inset-0 z-50 bg-[#0D1B2E]/70 backdrop-blur-md flex items-center justify-center px-4">

        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Top accent bar */}
          <div className="bg-[#1B2B4B] px-6 py-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-[#0EA5A0] flex items-center justify-center flex-shrink-0">
                <Zap size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">{storename}</p>
                <p className="text-white/50 text-xs">{formatTime()}</p>
              </div>
            </div>
            <p className="text-white/70 text-xs mt-3">
              Welcome back, <span className="text-white font-semibold">{cashiername}</span>
            </p>
          </div>

          {/* Body */}
          <div className="px-6 py-6 space-y-5">

            <div>
              <h2 className="text-lg font-bold text-[#1B2B4B]">Open till</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Enter the opening cash balance to start your shift. You cannot use the system until the till is opened.
              </p>
            </div>

            {/* Opening balance input */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">
                Opening balance (Ksh)
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="100"
                  value={openingBalance}
                  onChange={(e) => { setOpeningBalance(e.target.value); setError(null); }}
                  min="0"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleOpenTill()}
                  className="w-full h-12 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-xl
                             text-lg font-bold text-[#1B2B4B] placeholder:text-gray-300 placeholder:font-normal
                             focus:outline-none focus:border-[#0EA5A0] focus:ring-2 focus:ring-[#0EA5A0]/20
                             transition-all"
                />
              </div>
              {error && (
                <div className="flex items-center gap-1.5 mt-2">
                  <AlertCircle size={12} className="text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-500">{error}</p>
                </div>
              )}
            </div>

            {/* Shift start time preview */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">Shift start time</span>
              <span className="text-xs font-semibold text-[#1B2B4B]">{formatTime()}</span>
            </div>

            {/* Open till button */}
            <button
              onClick={handleOpenTill}
              disabled={!openingBalance || isOpening}
              className={`w-full h-12 rounded-2xl text-sm font-bold transition-all active:scale-[0.98]
                ${openingBalance && !isOpening
                  ? "bg-[#0EA5A0] text-white hover:bg-[#0c9490] shadow-lg shadow-[#0EA5A0]/25"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}
            >
              {isOpening ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Opening till...
                </span>
              ) : "Open till"}
            </button>

            <p className="text-center text-xs text-gray-300">
              This screen cannot be dismissed until the till is opened
            </p>
          </div>
        </div>
      </div>
    </>
  );
};