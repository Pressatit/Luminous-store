
const Bone = ({ className = "" }: { className?: string }) => (
  <div className={`bg-gray-200/70 animate-pulse ${className}`} />
);

// Mirrors the shape of <StockAlertRow />: grey card, left border, name + category, pill on the right
export const StockHealthSkeleton = () => (
  <div className="space-y-2">
    {/* Array.from({ length: 3 }) creates [undefined, undefined, undefined]
        so we can .map() over it and render 3 placeholder rows.
        The first argument `_` is unused, `i` is the index we use as the key. */}
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="bg-gray-100 rounded-xl flex items-center justify-between px-4 py-3 border-l-4 border-gray-200"
      >
        <div className="space-y-2">
          <Bone className="h-3.5 w-28 rounded" />
          <Bone className="h-3 w-16 rounded" />
        </div>
        <Bone className="h-7 w-16 rounded-full" />
      </div>
    ))}
  </div>
);

// Mirrors the shape of <ActivityRow />: round icon, two text lines, quantity on the right
export const ActivitySkeleton = () => (
  <div className="divide-y divide-gray-100">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-3">
        <Bone className="w-7 h-7 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Bone className="h-3.5 w-32 rounded" />
          <Bone className="h-3 w-44 rounded" />
        </div>
        <Bone className="h-4 w-14 rounded" />
      </div>
    ))}
  </div>
);