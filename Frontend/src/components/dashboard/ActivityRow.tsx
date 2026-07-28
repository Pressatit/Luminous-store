import type { ActivityItem } from "@/types/dashboard";

interface ActivityRowProps {
  item: ActivityItem;
}

const formatTime = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
};

export const ActivityRow = ({ item }: ActivityRowProps) => {
  const isIn = item.transactionType === "receive";

  return (
    <div className="flex items-center gap-3 py-2">
      {/* Direction dot */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
          ${isIn ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
      >
        {isIn ? "↓" : "↑"}
      </div>

      {/* Item info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1B2B4B] truncate">{item.itemName}</p>
        <p className="text-xs text-gray-400">
          {isIn ? "Received" : "Dispatched"} · {item.servedBy} · {formatTime(item.createdAt)}
        </p>
      </div>

      {/* Quantity delta */}
      <span className={`text-sm font-bold flex-shrink-0 ${isIn ? "text-green-600" : "text-red-500"}`}>
        {isIn ? "+" : "−"}{item.quantity} units
      </span>
    </div>
  );
};
