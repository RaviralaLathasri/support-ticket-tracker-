import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { Button } from './Button';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export function Table<T>({
  data,
  columns,
  pageSize = 5,
  emptyMessage = 'No data available',
  onRowClick
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = data.slice(startIndex, startIndex + pageSize);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="flex flex-col gap-4 w-full animate-fade-in">
      <div className="overflow-x-auto border border-slate-800/80 rounded-2xl bg-slate-900/20 backdrop-blur-md">
        <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-300">
          <thead className="bg-slate-900/60 text-slate-400 text-xs font-bold uppercase tracking-wider select-none">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} scope="col" className={`px-6 py-4.5 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={() => onRowClick?.(item)}
                  className={`hover:bg-slate-800/25 transition-colors duration-150 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-6 py-4 text-slate-300 font-medium ${col.className || ''}`}>
                      {col.accessor(item)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-3">
                    <Inbox className="h-10 w-10 text-slate-700" />
                    <span className="text-slate-500 text-sm font-medium">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {data.length > pageSize && (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/30 border border-slate-800/60 rounded-xl">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button variant="secondary" onClick={handlePrevPage} disabled={currentPage === 1} size="sm">
              Previous
            </Button>
            <Button variant="secondary" onClick={handleNextPage} disabled={currentPage === totalPages} size="sm">
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400">
                Showing <span className="font-semibold text-slate-200">{startIndex + 1}</span> to{' '}
                <span className="font-semibold text-slate-200">
                  {Math.min(startIndex + pageSize, data.length)}
                </span>{' '}
                of <span className="font-semibold text-slate-200">{data.length}</span> results
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="p-2 min-w-[36px]"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="inline-flex items-center px-4 rounded-xl border border-slate-800/80 bg-slate-900 text-xs font-semibold text-slate-350">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="p-2 min-w-[36px]"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
