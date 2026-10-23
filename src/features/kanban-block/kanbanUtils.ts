import { KanbanTask } from './types';

export const generateKanbanHtml = (tasks: KanbanTask[]): string => {
  const todo = tasks.filter((t) => t.column === 'todo');
  const inProg = tasks.filter((t) => t.column === 'in_progress');
  const done = tasks.filter((t) => t.column === 'done');

  return `
    <div class="notion-kanban-preview" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 1rem 0; padding: 12px; background: #1f1f1f; border-radius: 8px; border: 1px solid #333; font-size: 12px;">
      <div style="background: #262626; padding: 8px; border-radius: 6px;">
        <div style="font-weight: 600; color: #a1a1aa; margin-bottom: 6px;">📋 Do zrobienia (${todo.length})</div>
        ${todo.map((t) => `<div style="background: #1e1e1e; padding: 6px 8px; margin-bottom: 4px; border-radius: 4px; border: 1px solid #333; color: #e4e4e7;">${t.title}</div>`).join('')}
      </div>
      <div style="background: #262626; padding: 8px; border-radius: 6px;">
        <div style="font-weight: 600; color: #60a5fa; margin-bottom: 6px;">⚡ W trakcie (${inProg.length})</div>
        ${inProg.map((t) => `<div style="background: #1e1e1e; padding: 6px 8px; margin-bottom: 4px; border-radius: 4px; border: 1px solid #333; color: #e4e4e7;">${t.title}</div>`).join('')}
      </div>
      <div style="background: #262626; padding: 8px; border-radius: 6px;">
        <div style="font-weight: 600; color: #4ade80; margin-bottom: 6px;">✓ Zrobione (${done.length})</div>
        ${done.map((t) => `<div style="background: #1e1e1e; padding: 6px 8px; margin-bottom: 4px; border-radius: 4px; border: 1px solid #333; color: #a1a1aa; text-decoration: line-through;">${t.title}</div>`).join('')}
      </div>
    </div><p></p>
  `;
};
