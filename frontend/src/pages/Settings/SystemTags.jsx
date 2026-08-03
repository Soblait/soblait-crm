import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import SettingsLayout from './SettingsLayout.jsx';
import client from '../../api/client';

const COLORS = ['#8b5cf6', '#ec4899', '#22c55e', '#f59e0b', '#3b82f6', '#ef4444'];

export default function SystemTags() {
  const [tags, setTags] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', color: COLORS[0] });

  function refresh() {
    client.get('/settings/tags').then((res) => setTags(res.data));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    await client.post('/settings/tags', form);
    setForm({ name: '', color: COLORS[0] });
    setShowModal(false);
    refresh();
  }

  async function handleDelete(id) {
    await client.delete(`/settings/tags/${id}`);
    refresh();
  }

  return (
    <SettingsLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">System Tags</h2>
          <button onClick={() => setShowModal(true)} className="btn-gradient flex items-center gap-1.5 text-sm">
            <Plus size={15} /> Add Tag
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
              <button onClick={() => handleDelete(tag.id)}>
                <X size={13} />
              </button>
            </span>
          ))}
          {tags.length === 0 && <div className="text-sm text-gray-400">No tags yet.</div>}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Add Tag</h3>
              <button onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                placeholder="Tag name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              />
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-7 h-7 rounded-full ${form.color === c ? 'ring-2 ring-offset-2 ring-brand-purple' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button type="submit" className="w-full btn-gradient justify-center flex py-2.5">
                Add Tag
              </button>
            </form>
          </div>
        </div>
      )}
    </SettingsLayout>
  );
}
