import React from 'react';
import { CheckSquare, CheckCircle2 } from 'lucide-react';
import { DocBlock } from '../../types/workspace';

interface TodoProgressBarProps {
  blocks: DocBlock[];
}

export const TodoProgressBar: React.FC<TodoProgressBarProps> = ({ blocks }) => {
  const todos = blocks.filter((b) => b.type === 'todo');
  if (todos.length === 0) return null;

  const completed = todos.filter((b) => b.checked).length;
  const total = todos.length;
  const percentage = Math.round((completed / total) * 100);
  const isAllDone = total > 0 && completed === total;

  return (
    <div className="mb-6 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl select-none animate-in fade-in duration-150">
      <div className="flex items-center justify-between text-xs mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              isAllDone ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
            }`}
          >
            {isAllDone ? <CheckCircle2 size={14} /> : <CheckSquare size={14} />}
          </div>
          <span className="font-semibold text-slate-800">
            {isAllDone ? 'Wszystkie zadania ukończone!' : 'Postęp zadań w dokumencie'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500">
            {completed} z {total}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
              isAllDone ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {percentage}%
          </span>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            isAllDone ? 'bg-emerald-500' : 'bg-blue-600'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
