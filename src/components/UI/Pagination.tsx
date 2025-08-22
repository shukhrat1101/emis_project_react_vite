import React from 'react';
import "./Pagination.scss";

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.ceil(total / pageSize);

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onPageSizeChange) {
      onPageSizeChange(Number(e.target.value));
    }
  };

  const getDisplayedPages = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="pagination-wrapper">
      <div className="pagination-left">
        <label>Ko‘rsatish:</label>
        <select value={pageSize} onChange={handlePageSizeChange}>
          <option value={10}>10 ta</option>
          <option value={15}>15 ta</option>
          <option value={20}>20 ta</option>
        </select>
      </div>

      <div className="pagination-right">
        {getDisplayedPages().map((p, index) => (
          typeof p === 'number' ? (
            <button
              key={index}
              className={`page-btn ${p === page ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ) : (
            <span key={index} className="dots">...</span>
          )
        ))}
      </div>
    </div>
  );
};

export default Pagination;
