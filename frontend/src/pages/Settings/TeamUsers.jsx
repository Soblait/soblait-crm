import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X, Loader2 } from 'lucide-react';
import SettingsLayout from './SettingsLayout.jsx';
import client from '../../api/client';
import { useConfirm } from '../../context/ConfirmContext.jsx';

const ROLES = ['Admin', 'Sales Rep', 'Manager'];

export default function TeamUsers() {
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'Sales Rep', password: '' });

  function refresh() {
    client.get('/settings/users').then((res) => setUsers(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    await client.post('/settings/users', form);
    setShowModal(false);
    setForm({ name: '', email: '', role: 'Sales Rep', password: '' });
    refresh();
  }

  async function handleDelete(id) {
    if (!(await confirm('Remove this team member?'))) return;
    await client.delete(`/settings/users/${id}`);
    refresh();
  }

  return (
    <SettingsLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Team & Users</h2>
          <button onClick={() => setShowModal(true)} className="btn-gradient flex items-center gap-1.5 text-sm">
            <Plus size={15} /> Add User
          </button>
        </div>
        {loading && (
          <div className="card p-8 text-center text-gray-400 flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading team…
          </div>
        )}
        {!loading && (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {users.map((u) => (
            <div key={u.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm text-gray-900 dark:text-white">{u.name}</div>
                <div className="text-xs text-gray-400">{u.email}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge bg-brand-purple/10 text-brand-purple dark:text-brand-purple2">{u.role}</span>
                <button onClick={() => handleDelete(u.id)} className="text-gray-400 hover:text-red-400">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Add User</h3>
              <button onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <input
                type="password"
                placeholder="Temporary password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              />
              <button type="submit" className="w-full btn-gradient justify-center flex py-2.5">
                Add User
              </button>
            </form>
          </div>
        </div>
      )}
    </SettingsLayout>
  );
}
