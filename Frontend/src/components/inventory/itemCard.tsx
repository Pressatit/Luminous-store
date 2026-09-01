import { AlertTriangle } from "lucide-react";

// This matches what your GET /items/all returns
// plus quantity which comes from joining stock table
export interface ItemCardData {
  id:          number;
  name:        string;
  category:    string;
  img_path:    string | null;
  unit_price:   number;
  quantity:    number;        // SUM from stock table
  reorder_level: number;
}

interface ItemCardProps {
  item: ItemCardData;
}

export const ItemCard = ({ item }: ItemCardProps) => {
  // Stock status logic — ties directly to our reorder_level field
  const isCritical = item.quantity === 0;
  const isLow      = item.quantity > 0 && item.quantity <= item.reorder_level;
  const isHealthy  = item.quantity > item.reorder_level;

  const statusLabel = isCritical ? "Out of stock" : isLow ? "Stock low" : "In stock";
  const statusColor = isCritical
    ? "text-red-500"
    : isLow
    ? "text-amber-500"
    : "text-green-600";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden
                    hover:shadow-md hover:border-gray-200 transition-all duration-200 flex flex-col">

      {/* Item image */}
      <div className="w-full aspect-[4/3] bg-gray-50 overflow-hidden flex-shrink-0">
        {item.img_path ? (
          <img
            src={item.img_path}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          // Placeholder when no image registered
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-gray-300 font-medium">No image</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Card body */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-sm font-bold text-[#1B2B4B] leading-tight">{item.name}</p>

        {/* Quantity badge — circular like the wireframe */}
        <div className="flex items-center justify-center">
          <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center
            ${isCritical ? "border-red-200 bg-red-50"
              : isLow    ? "border-amber-200 bg-amber-50"
              : "border-gray-100 bg-gray-50"}`}
          >
            <span className={`text-sm font-bold
              ${isCritical ? "text-red-500" : isLow ? "text-amber-500" : "text-[#1B2B4B]"}`}
            >
              {item.quantity}
            </span>
          </div>
        </div>

        {/* Unit Price */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Unit price:</span>
          <span className="text-xs font-semibold text-[#1B2B4B]">
            Ksh {item.unit_price.toLocaleString() || 0}
          </span>
        </div>

        {/* Stock status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Status:</span>
          <span className={`text-xs font-semibold flex items-center gap-1 ${statusColor}`}>
            {(isCritical || isLow) && <AlertTriangle size={10} />}
            {statusLabel}
          </span>
        </div>
      </div>
    </div>
  );
};