import React, { useState } from 'react';
import { Columns3, Plus, ArrowRight, Trash2, X, Check } from 'lucide-react';
import { useKanban } from './useKanban';
import { generateKanbanHtml } from './kanbanUtils';

interface KanbanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (html: string) => void;
}

export const KanbanBoard: React.FC<KanbanModalProps> = ({ isOpen, onClose, onInsert }) => {
  const { tasks, newTaskTitle, setNewTaskTitle, addTask, moveTask, deleteTask } = useKanban();
  const [selectedCol, setSelectedCol] = useState<'todo' | 'in_progress' | 'done'>('todo');

  if (!isOpen) return null;

  const handleInsert = () => {
    const html = generateKanbanHtml(tasks);
    onInsert(html);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#222] border border-[#333] rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] text-xs">
        <div className="p-3 border-b border-[#333] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Columns3 size={16} className="text-blue-400" />
            <span className="font-semibold text-zinc-100">Mini Tablica Kanban</span>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-200">
            <X size={15} />
          </button>
        </div>

        {/* Add task bar */}
        <div className="p-3 border-b border-[#333] flex items-center gap-2 bg-[#1c1c1c]">
          <input
            type="text"
            placeholder="Nazwa zadania..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask(selectedCol)}
            className="flex-1 bg-[#252525] border border-[#333] rounded px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-blue-500"
          />
          <select
            value={selectedCol}
            onChange={(e) => setSelectedCol(e.target.value as any)}
            className="bg-[#252525] border border-[#333] rounded px-2 py-1.5 text-zinc-300 text-xs focus:outline-none"
          >
            <option value="todo">Do zrobienia</option>
            <option value="in_progress">W trakcie</option>
            <option value="done">Zrobione</option>
          </select>
          <button
            onClick={() => addTask(selectedCol)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-1 font-medium cursor-pointer"
          >
            <Plus size={13} /> Dodaj
          </button>
        </div>

        {/* 3 Columns */}
        <div className="p-4 grid grid-cols-3 gap-3 flex-1 overflow-auto bg-[#181818]">
          {/* To Do */}
          <div className="bg-[#202020] border border-[#2e2e2e] rounded p-2 flex flex-col">
            <div className="font-semibold text-zinc-400 mb-2 pb-1 border-b border-[#2e2e2e] flex justify-between">
              <span>Do zrobienia</span>
              <span className="text-[10px] bg-[#2a2a2a] px-1.5 rounded">
                {tasks.filter((t) => t.column === 'todo').length}
              </span>
            </div>
            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {tasks
                .filter((t) => t.column === 'todo')
                .map((task) => (
                  <div
                    key={task.id}
                    className="bg-[#262626] border border-[#333] p-2 rounded flex items-center justify-between group"
                  >
                    <span className="truncate">{task.title}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveTask(task.id, 'in_progress')}
                        title="Przenieś do: W trakcie"
                        className="text-zinc-500 hover:text-blue-400"
                      >
                        <ArrowRight size={12} />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-zinc-600 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-[#202020] border border-[#2e2e2e] rounded p-2 flex flex-col">
            <div className="font-semibold text-blue-400 mb-2 pb-1 border-b border-[#2e2e2e] flex justify-between">
              <span>W trakcie</span>
              <span className="text-[10px] bg-[#2a2a2a] px-1.5 rounded">
                {tasks.filter((t) => t.column === 'in_progress').length}
              </span>
            </div>
            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {tasks
                .filter((t) => t.column === 'in_progress')
                .map((task) => (
                  <div
                    key={task.id}
                    className="bg-[#262626] border border-[#333] p-2 rounded flex items-center justify-between group"
                  >
                    <span className="truncate">{task.title}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveTask(task.id, 'done')}
                        title="Przenieś do: Zrobione"
                        className="text-zinc-500 hover:text-emerald-400"
                      >
                        <ArrowRight size={12} />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-zinc-600 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Done */}
          <div className="bg-[#202020] border border-[#2e2e2e] rounded p-2 flex flex-col">
            <div className="font-semibold text-emerald-400 mb-2 pb-1 border-b border-[#2e2e2e] flex justify-between">
              <span>Zrobione</span>
              <span className="text-[10px] bg-[#2a2a2a] px-1.5 rounded">
                {tasks.filter((t) => t.column === 'done').length}
              </span>
            </div>
            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {tasks
                .filter((t) => t.column === 'done')
                .map((task) => (
                  <div
                    key={task.id}
                    className="bg-[#262626] border border-[#333] p-2 rounded flex items-center justify-between group"
                  >
                    <span className="line-through text-zinc-500 truncate">{task.title}</span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-zinc-600 hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#333] flex justify-end gap-2 bg-[#202020]">
          <button onClick={onClose} className="px-3 py-1.5 rounded hover:bg-[#2e2e2e] text-zinc-400">
            Anuluj
          </button>
          <button
            onClick={handleInsert}
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5"
          >
            <Check size={14} /> Wstaw do notatki
          </button>
        </div>
      </div>
    </div>
  );
};
