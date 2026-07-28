import { useNavigate } from "react-router-dom";
import { PackagePlus, PackageMinus, ScanBarcode, LayoutGrid, BarChart2 } from "lucide-react";

const ACTIONS = [
  { label: "Add items",       icon: PackagePlus,  path: "/receive"   },
  { label: "Checkout items",  icon: PackageMinus, path: "/dispatch"  },
  { label: "Register item",   icon: ScanBarcode,  path: "/register"  },
  { label: "Store catalogue", icon: LayoutGrid,   path: "/inventory" },
  { label: "Report",          icon: BarChart2,    path: "/report"    },
];

export const QuickActions = () => {
  const navigate = useNavigate();

  return (
    /* Horizontally scrollable on mobile, wraps on desktop */
    <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-5 md:overflow-visible scrollbar-hide">
      {ACTIONS.map(({ label, icon: Icon, path }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          className="flex-shrink-0 w-[120px] md:w-auto bg-[#C8E8E8] hover:bg-[#b0d8d8]
                     active:scale-95 transition-all rounded-2xl p-4 flex flex-col
                     items-center gap-2 cursor-pointer"
        >
          <Icon size={24} className="text-[#1B2B4B]" />
          <span className="text-xs font-semibold text-[#1B2B4B] text-center leading-tight">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
};
