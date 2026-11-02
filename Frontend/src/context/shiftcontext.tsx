import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Activeshifts } from "../types/shift";

interface ShiftContextValue {
  activeShift:    Activeshifts | null;
  setActiveShift: (shift: Activeshifts | null) => void;
  clearShift:     () => void;
}

const ShiftContext = createContext<ShiftContextValue | null>(null);

export const ShiftProvider = ({ children }: { children: ReactNode }) => {
  const [activeShift, setActiveShift] = useState<Activeshifts | null>(null);

  const clearShift = useCallback(() => setActiveShift(null), []);

  return (
    <ShiftContext.Provider value={{ activeShift, setActiveShift, clearShift }}>
      {children}
    </ShiftContext.Provider>
  );
};

export const useShift = () => {
  const ctx = useContext(ShiftContext);
  if (!ctx) throw new Error("useShift must be used inside ShiftProvider");
  return ctx;
};