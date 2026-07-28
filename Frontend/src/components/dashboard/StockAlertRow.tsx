import type { StockAlert } from "../../types/dashboard";

interface StockAlertRowProps {
  alert: StockAlert;
}

export const StockAlertRow = ({ alert }: StockAlertRowProps) => {
  const isCritical = alert.quantityAvailable <= Math.floor(alert.lowStockThreshold * 0.3);

  return (
    <div
      className={`bg-gray-100 rounded-xl flex items-center justify-between px-4 py-3
        border-l-4 ${isCritical ? "border-red-500" : "border-amber-400"}`}
    >
      <div>
        <p className="text-sm font-semibold text-[#1B2B4B]">{alert.itemName}</p>
        <p className="text-xs text-gray-500">{alert.category}</p>
      </div>
      <span
        className={`text-xs font-bold px-3 py-1.5 rounded-full
          ${isCritical
            ? "bg-red-500 text-white"
            : "bg-amber-400 text-amber-900"
          }`}
      >
        {alert.quantityAvailable} left
      </span>
    </div>
  );
};
