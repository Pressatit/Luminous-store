import { useMemo } from "react";

// DOTS is used as a placeholder for "..." in the page number list
export const DOTS = "DOTS";

// Generates a range array e.g. range(1,5) → [1,2,3,4,5]
const range = (start: number, end: number) => {
  const length = end - start + 1;
  return Array.from({ length }, (_, i) => i + start);
};

interface UsePaginationProps {
  totalCount:   number;  // total number of items
  pageSize:     number;  // how many items per page
  currentPage:  number;  // current active page (1-indexed)
  siblingCount?: number; // how many page numbers to show either side of current
}

export const usePagination = ({
  totalCount,
  pageSize,
  currentPage,
  siblingCount = 1,
}: UsePaginationProps) => {
  // Total number of pages
  const totalPages = Math.ceil(totalCount / pageSize);

  // paginationRange is the array of page numbers/DOTS to render
  const paginationRange = useMemo(() => {
    // Total page numbers shown = siblings + first + last + current + 2*DOTS
    const totalPageNumbers = siblingCount + 5;

    // If all pages fit, just show them all
    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages);
    }

    const leftSiblingIndex  = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const showLeftDots  = leftSiblingIndex  > 2;
    const showRightDots = rightSiblingIndex < totalPages - 2;

    if (!showLeftDots && showRightDots) {
      const leftRange = range(1, 3 + 2 * siblingCount);
      return [...leftRange, DOTS, totalPages];
    }

    if (showLeftDots && !showRightDots) {
      const rightRange = range(totalPages - (3 + 2 * siblingCount) + 1, totalPages);
      return [1, DOTS, ...rightRange];
    }

    const middleRange = range(leftSiblingIndex, rightSiblingIndex);
    return [1, DOTS, ...middleRange, DOTS, totalPages];
  }, [totalCount, pageSize, currentPage, siblingCount]);

  return { paginationRange, totalPages };
};