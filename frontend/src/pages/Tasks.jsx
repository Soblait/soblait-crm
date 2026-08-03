import React, { useEffect, useState } from 'react';
import { Plus, X, Pencil, Trash2 } from 'lucide-react';
import client from '../api/client';

const COLUMNS = [
  { key: 'todo', label: 'Todo' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

const PRIORITY_STYLE = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

const EMPTY_FORM = { title: '', due_date: '', priority: 'medium', status: 'todo' };

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  function refresh() {
    client.get('/tasks').then((res) => setTasks(res.data));
  }

  useEffect(() => {
    refresh();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(task) {
    setEditing(task);
    setForm({ ...EMPTY_FORM, ...task });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editing) {
      await client.put(`/tasks/${editing.id}`, form);
    } else {
      await client.post('/tasks', form);
    }
    setShowModal(false);
    refresh();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this task?')) return;
    await client.delete(`/tasks/${id}`);
    refresh();
  }

  async function changeStatus(task, status) {
    await client.put(`/tasks/${task.id}`, { ...task, status });
    refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={openCreate} className="btn-gradient flex items-center gap-1.5 text-sm">
          <Plus size={15} /> Add Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="card p-3">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="font-medium text-sm text-gray-700 dark:text-gray-200">{col.label}</div>
                <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-500">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.map((task) => (
                  <div key={task.id} className="rounded-lg border border-gray-100 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-800/60">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{task.title}</div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => openEdit(task)} className="text-gray-400 hover:text-brand-purple">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(task.id)} className="text-gray-400 hover:text-red-400">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`badge ${PRIORITY_STYLE[task.priority] || ''}`}>{task.priority}</span>
                      {task.due_date && <span className="text-xs text-gray-400">{task.due_date}</span>}
                    </div>
                    <select
                      value={task.status}
                      onChange={(e) => changeStatus(task, e.target.value)}
                      className="mt-2 w-full text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                    >
                      {COLUMNS.map((c) => (
                        <option key={c.key} value={c.key}>
                          Move to {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                {colTasks.length === 0 && <div className="text-xs text-gray-400 px-1 py-4 text-center">No tasks</div>}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editing ? 'Edit Task' : 'Add Task'}</h3>
              <button onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                placeholder="Task title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              />
              <input
                type="date"
                value={form.due_date || ''}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              />
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              >
                {COLUMNS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
              <button type="submit" className="w-full btn-gradient justify-center flex py-2.5">
                {editing ? 'Save Changes' : 'Create Task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
