export interface KanbanTask {
  id: string;
  title: string;
  column: 'todo' | 'in_progress' | 'done';
}

export interface KanbanColumn {
  id: 'todo' | 'in_progress' | 'done';
  title: string;
  color: string;
}
