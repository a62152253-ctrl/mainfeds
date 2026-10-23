import React from 'react';
import { Table as TableIcon, Plus, Minus, X, Check, Trash2 } from 'lucide-react';
import { useTable } from './useTable';
import { generateTableHtml } from './tableUtils';

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (tableHtml: string) => void;
}

export const TableModal: React.FC<TableModalProps> = ({ isOpen, onClose, onInsert }) => {
  const { config, setConfig, data, updateCell, addRow, removeRow, addCol, removeCol, clearTable } = useTable(3, 3);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const html = generateTableHtml(config, data);
    onInsert(html);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#202228] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] text-xs text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-700/80 flex items-center justify-between bg-[#171920]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <TableIcon size={15} />
            </div>
            <span className="font-bold text-slate-100 text-sm">Kreator Tabeli</span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800">
            <X size={15} />
          </button>
        </div>

        {/* Options */}
        <div className="p-3 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3 bg-[#1b1d24] text-slate-300">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.hasHeader}
                onChange={(e) => setConfig((prev) => ({ ...prev, hasHeader: e.target.checked }))}
                className="accent-blue-500 rounded"
              />
              <span>Wiersz nagłówka</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.striped}
                onChange={(e) => setConfig((prev) => ({ ...prev, striped: e.target.checked }))}
                className="accent-blue-500 rounded"
              />
              <span>Paski naprzemienne</span>
            </label>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={addRow}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus size={11} /> Wiersz
            </button>
            <button
              onClick={() => removeRow(data.length - 1)}
              disabled={data.length <= 1}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-40"
              title="Usuń ostatni wiersz"
            >
              <Minus size={11} /> Wiersz
            </button>
            <button
              onClick={addCol}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus size={11} /> Kolumna
            </button>
            <button
              onClick={() => removeCol((data[0]?.length || 1) - 1)}
              disabled={(data[0]?.length || 0) <= 1}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-40"
              title="Usuń ostatnią kolumnę"
            >
              <Minus size={11} /> Kolumna
            </button>
            <button
              onClick={clearTable}
              className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer ml-1"
              title="Wyczyść zawartość"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Grid Preview / Edit */}
        <div className="p-4 flex-1 overflow-auto bg-[#13151b]">
          <table className="w-full border-collapse border border-slate-700/80 rounded-lg overflow-hidden">
            <tbody>
              {data.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className={
                    rIdx === 0 && config.hasHeader
                      ? 'bg-slate-800/80 font-semibold text-slate-100'
                      : config.striped && rIdx % 2 === 1
                      ? 'bg-slate-900/50'
                      : 'bg-transparent'
                  }
                >
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="border border-slate-700/80 p-1">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                        className="w-full bg-transparent px-2 py-1 text-slate-200 text-xs focus:bg-slate-800 rounded focus:outline-none"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-700/80 flex justify-end gap-2 bg-[#171920]">
          <button onClick={onClose} className="px-3.5 py-1.5 rounded-xl hover:bg-slate-800 text-slate-400 font-medium cursor-pointer">
            Anuluj
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <Check size={14} />
            <span>Wstaw tabelę</span>
          </button>
        </div>
      </div>
    </div>
  );
};
