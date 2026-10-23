import { useState } from 'react';
import { KanbanTask } from './types';

const INITIAL_TASKS: KanbanTask[] = [
  { id: '1', title: 'Plan kwartalny', column: 'todo' },
  { id: '2', title: 'Wdrożenie modułów', column: 'in_progress' },
  { id: '3', title: 'Projekt UI Workspace', column: 'done' },
];

export const useKanban = () => {
  const [tasks, setTasks] = useState<KanbanTask[]>(INITIAL_TASKS);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const addTask = (column: 'todo' | 'in_progress' | 'done') => {
    if (!newTaskTitle.trim()) return;
    const newTask: KanbanTask = {
      id: 'k-' + Date.now(),
      title: newTaskTitle.trim(),
      column,
    };
    setTasks((prev) => [...prev, newTask]);
    setNewTaskTitle('');
  };

  const moveTask = (id: string, nextCol: 'todo' | 'in_progress' | 'done') => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, column: nextCol } : t))
    );
  };

  const editTask = (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: newTitle.trim() } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const clearDoneTasks = () => {
    setTasks((prev) => prev.filter((t) => t.column !== 'done'));
  };

  return {
    tasks,
    newTaskTitle,
    setNewTaskTitle,
    addTask,
    moveTask,
    editTask,
    deleteTask,
    clearDoneTasks,
  };
};
