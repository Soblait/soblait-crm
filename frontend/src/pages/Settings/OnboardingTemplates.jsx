import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import SettingsLayout from './SettingsLayout.jsx';
import client from '../../api/client';

const EMPTY = { name: '', body: '' };

export default function OnboardingTemplates() {
  const [templates, setTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  function refresh() {
    client.get('/settings/onboarding-templates').then((res) => setTemplates(res.data));
  }

  useEffect(() => {
    refresh();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setShowModal(true);
  }

  function openEdit(t) {
    setEditing(t);
    setForm({ name: t.name, body: t.body });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editing) {
      await client.put(`/settings/onboarding-templates/${editing.id}`, form);
    } else {
      await client.post('/settings/onboarding-templates', form);
    }
    setShowModal(false);
    refresh();
  }

  async function handleDelete(id) {
    await client.delete(`/settings/onboarding-templates/${id}`);
    refresh();
  }

  return (
    <SettingsLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Onboarding Templates</h2>
          <button onClick={openCreate} className="btn-gradient flex items-center gap-1.5 text-sm">
            <Plus size={15} /> Add Template
          </button>
        </div>
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {templates.map((t) => (
            <div key={t.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm text-gray-900 dark:text-white">{t.name}</div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(t)} className="text-gray-400 hover:text-brand-purple">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-red-400">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">{t.body}</div>
            </div>
          ))}
          {templates.length === 0 && <div className="p-8 text-center text-gray-400">No templates yet.</div>}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editing ? 'Edit Template' : 'Add Template'}</h3>
              <button onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                placeholder="Template name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              />
              <textarea
                placeholder="Body"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              />
              <button type="submit" className="w-full btn-gradient justify-center flex py-2.5">
                {editing ? 'Save Changes' : 'Create Template'}
              </button>
            </form>
          </div>
        </div>
      )}
    </SettingsLayout>
  );
}
