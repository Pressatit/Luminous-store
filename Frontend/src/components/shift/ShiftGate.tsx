import { useState, useEffect, type ReactNode } from "react";
import { OpenTillModal } from "./openTillModal";
import { useShift }      from "../../context/shiftcontext";
import type { Activeshifts } from "../../types/shift";

const Backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface ShiftGateProps {
  children: ReactNode;
}

export const ShiftGate = ({ children }: ShiftGateProps) => {
  const { activeShift, setActiveShift } = useShift();

  const [checking,      setChecking]      = useState(true);
  const [needsOpenTill, setNeedsOpenTill] = useState(false);

   
  
 useEffect(() => {
    const user = JSON.parse(localStorage.getItem("JORISA_USER") ?? "{}");
  const isCashier  = user.role === "cashier";
  const token = localStorage.getItem("JORISA_TOKEN");

  // Not logged in — nothing to do
  if (!token) {
    setChecking(false);
    return;
  }

  if(activeShift && isCashier){
    return;
  }


  const checkShift = async () => {
    
    try {
      const res = await fetch(`${Backend}/shifts/active`, {
        headers: {
          "Authorization":              `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });

      if(res.ok){
        const data = await res.json();

        if (data) {
          console.log("ShiftGate setting activeShift:", data);
          setActiveShift(data as Activeshifts);
          setNeedsOpenTill(false);
        } 
        // If the backend returned None (null body)
        else {
          setActiveShift(null);
          if (isCashier) setNeedsOpenTill(true);
        }
      }
    } catch (err) {
        console.error("ShiftGate network error:", err);
    }
    finally {
      setChecking(false);
    }
  };

  checkShift();
}, []); 

  // Loading state — brief flicker while checking
  if (checking) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0EA5A0]/30 border-t-[#0EA5A0] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Render the app behind the modal */}
      {children}

      {/* Open till modal — renders on top, blurs app */}
      {needsOpenTill && (
        <OpenTillModal onShiftOpened={() => setNeedsOpenTill(false)} />
      )}
    </>
  );
};