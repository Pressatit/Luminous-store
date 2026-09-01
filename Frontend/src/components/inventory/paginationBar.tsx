import { ChevronLeft, ChevronRight } from "lucide-react";
import { DOTS } from "../../hooks/usePagination";

interface PaginationBarProps {
  currentPage:     number;
  totalPages:      number;
  paginationRange: (number | string)[];
  onPageChange:    (page: number) => void;
}

export const PaginationBar = ({
  currentPage,
  totalPages,
  paginationRange,
  onPageChange,
}: PaginationBarProps) => {
  if (totalPages <= 1) return null; // No pagination needed for single page

  const btnBase = "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all";

  return (
    <div className="flex items-center justify-center gap-1 pt-4">

      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${btnBase} border border-gray-200
          ${currentPage === 1
            ? "text-gray-200 cursor-not-allowed"
            : "text-[#1B2B4B] hover:bg-gray-100"}`}
      >
        <ChevronLeft size={16} />
      </button>

      {/* Page numbers */}
      {paginationRange.map((page, idx) =>
        page === DOTS ? (
          // Dots placeholder — not clickable
          <span key={`dots-${idx}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(Number(page))}
            className={`${btnBase}
              ${currentPage === page
                ? "bg-[#1B2B4B] text-white shadow-md"
                : "border border-gray-200 text-[#1B2B4B] hover:bg-gray-50"}`}
          >
            {page}
          </button>
        )
      )}

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${btnBase} border border-gray-200
          ${currentPage === totalPages
            ? "text-gray-200 cursor-not-allowed"
            : "text-[#1B2B4B] hover:bg-gray-100"}`}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};