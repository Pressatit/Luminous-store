import { useState, useEffect } from "react";
import { Clock, DollarSign, XCircle, CheckCircle } from "lucide-react";
import { toast }        from "sonner";
import { useShift }     from "../../context/shiftcontext";
import { useNavigate }  from "react-router-dom";

const Backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

// Live shift duration calculator
const useShiftDuration = (openedAt: string | undefined) => {
  const [duration, setDuration] = useState("0h 0m");

  useEffect(() => {
    if (!openedAt) return;

    const calc = () => {
      const diff    = Date.now() - new Date(openedAt).getTime();
      const hours   = Math.floor(diff / 3_600_000);
      const minutes = Math.floor((diff % 3_600_000) / 60_000);
      setDuration(`${hours}h ${minutes}m`);
    };

    calc();
    const id = setInterval(calc, 60_000); // update every minute
    return () => clearInterval(id);
  }, [openedAt]);

  return duration;
};

export const ShiftCard = () => {
  const { activeShift, clearShift } = useShift();

 

  const navigate                    = useNavigate();
  const [isClosing, setIsClosing]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const duration                    = useShiftDuration(activeShift?.opened_at);

  const handleCloseShift = async () => {
    setIsClosing(true);
    const token = localStorage.getItem("JORISA_TOKEN");
    try {
      const res = await fetch(`${Backend}/shifts/close`, {
        method:  "POST",
        headers: {
          "Authorization":              `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to close shift");
      }

      toast.success("Shift closed. Have a good rest!");
      clearShift();
      // Log the cashier out after closing shift
      localStorage.removeItem("JORISA_TOKEN");
      localStorage.removeItem("JORISA_USER");
      navigate("/signin");

    } catch (err: any) {
      toast.error(err.message || "Could not close shift");
    } finally {
      setIsClosing(false);
      setShowConfirm(false);
    }
  };


   if (!activeShift) {
    return (
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <p className="text-sm text-gray-500">No active shift</p>
      </div>
    );
  }

  const openedTime = new Date(activeShift.opened_at).toLocaleTimeString("en-KE", {
    hour: "2-digit", minute: "2-digit"
  });

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

        {/* Section header */}
        <div className="px-5 py-3 border-b border-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Shift & cashier actions
          </p>
        </div>

        <div className="px-5 py-4 space-y-4">

          {/* Shift stats row */}
          <div className="grid grid-cols-2 gap-3">

            <div className="bg-gray-50 rounded-xl px-3 py-3">
              <p className="text-xs text-gray-400 mb-1">Shift start</p>
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-[#0EA5A0]" />
                <p className="text-sm font-bold text-[#1B2B4B]">{openedTime}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl px-3 py-3">
              <p className="text-xs text-gray-400 mb-1">Shift hours</p>
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-amber-500" />
                <p className="text-sm font-bold text-[#1B2B4B]">{duration}</p>
              </div>
            </div>
          </div>

          {/* Opening balance */}
          <div className="bg-gray-50 rounded-xl px-3 py-3">
            <p className="text-xs text-gray-400 mb-1">Opening balance</p>
            <div className="flex items-center gap-1.5">
              <DollarSign size={13} className="text-green-500" />
              <p className="text-sm font-bold text-[#1B2B4B]">
                Ksh {activeShift.opening_balance.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Close shift button */}
          <button
            onClick={() => setShowConfirm(true)}
            disabled={isClosing}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl
                       bg-red-50 hover:bg-red-100 text-red-500 text-sm font-bold
                       border border-red-100 transition-all active:scale-[0.98]"
          >
            <XCircle size={15} />
            Close shift
          </button>
        </div>
      </div>

      {/* Close shift confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"
               onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-base font-bold text-[#1B2B4B] mb-1">Close shift?</h2>
            <p className="text-xs text-gray-400 mb-5">
              This will end your shift and log you out. Duration: <span className="font-semibold text-[#1B2B4B]">{duration}</span>
            </p>
            <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 space-y-1">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Opened at</span>
                <span className="text-xs font-semibold text-[#1B2B4B]">{openedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Opening balance</span>
                <span className="text-xs font-semibold text-[#1B2B4B]">
                  Ksh {activeShift.opening_balance.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleCloseShift} disabled={isClosing}
                className="flex-1 h-11 rounded-xl bg-red-500 text-white text-sm font-bold
                           hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                {isClosing
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><CheckCircle size={14} /> Confirm close</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};