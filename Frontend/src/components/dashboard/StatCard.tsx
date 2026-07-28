import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  subLabel?: string;
  bgClass: string;       // Tailwind bg color
  textClass: string;     // Tailwind text color
  iconBgClass: string;   // icon circle bg
}

export const StatCard = ({
  icon: Icon,
  value,
  label,
  subLabel,
  bgClass,
  textClass,
  iconBgClass,
}: StatCardProps) => (
  <div className={`${bgClass} rounded-2xl p-4 flex flex-col gap-2 min-h-[110px]`}>
    <div className={`${iconBgClass} w-9 h-9 rounded-xl flex items-center justify-center`}>
      <Icon size={18} className={textClass} />
    </div>
    <div>
      <div className={`text-2xl font-bold ${textClass} leading-tight`}>
        {value}
      </div>
      {subLabel && (
        <div className={`text-xs font-medium ${textClass} opacity-80 leading-tight`}>
          {subLabel}
        </div>
      )}
      <div className={`text-sm font-semibold ${textClass} opacity-90 mt-0.5`}>
        {label}
      </div>
    </div>
  </div>
);
