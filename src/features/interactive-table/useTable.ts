import { useState } from 'react';
import { TableConfig } from './types';

export const useTable = (initialRows: number = 3, initialCols: number = 3) => {
  const [config, setConfig] = useState<TableConfig>({
    rows: initialRows,
    cols: initialCols,
    hasHeader: true,
    bordered: true,
    striped: true,
  });

  const [data, setData] = useState<string[][]>(() =>
    Array.from({ length: initialRows }, (_, r) =>
      Array.from({ length: initialCols }, (_, c) => (r === 0 ? `Nagłówek ${c + 1}` : `Wpis ${r},${c + 1}`))
    )
  );

  const updateCell = (row: number, col: number, val: string) => {
    setData((prev) => {
      const copy = prev.map((r) => [...r]);
      if (copy[row]) copy[row][col] = val;
      return copy;
    });
  };

  const addRow = () => {
    setData((prev) => {
      const currentCols = prev[0]?.length || config.cols;
      return [
        ...prev,
        Array.from({ length: currentCols }, (_, c) => `Wpis ${prev.length},${c + 1}`),
      ];
    });
    setConfig((prev) => ({ ...prev, rows: prev.rows + 1 }));
  };

  const removeRow = (rowIdx: number) => {
    setData((prev) => {
      if (prev.length <= 1) return prev; // keep at least 1 row
      return prev.filter((_, idx) => idx !== rowIdx);
    });
    setConfig((prev) => ({ ...prev, rows: Math.max(1, prev.rows - 1) }));
  };

  const addCol = () => {
    setData((prev) =>
      prev.map((r, rIdx) => [...r, rIdx === 0 ? `Nagłówek ${r.length + 1}` : 'Wpis'])
    );
    setConfig((prev) => ({ ...prev, cols: prev.cols + 1 }));
  };

  const removeCol = (colIdx: number) => {
    setData((prev) => {
      if ((prev[0]?.length || 0) <= 1) return prev; // keep at least 1 col
      return prev.map((r) => r.filter((_, idx) => idx !== colIdx));
    });
    setConfig((prev) => ({ ...prev, cols: Math.max(1, prev.cols - 1) }));
  };

  const clearTable = () => {
    setData([
      ['Kolumna 1', 'Kolumna 2', 'Kolumna 3'],
      ['', '', ''],
      ['', '', ''],
    ]);
    setConfig((prev) => ({ ...prev, rows: 3, cols: 3 }));
  };

  return {
    config,
    setConfig,
    data,
    updateCell,
    addRow,
    removeRow,
    addCol,
    removeCol,
    clearTable,
  };
};
