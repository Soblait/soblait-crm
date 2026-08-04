import React, { useEffect, useState } from 'react';
import { Plus, X, Trash2, Pencil, Check, Circle, CheckCircle2 } from 'lucide-react';
import client from '../api/client';

const EMPTY_FORM = { name: '', contact_name: '', contact_email: '', project_id: '', notes: '' };

function currency(n) {
  return `$${Number(n || 0).toLocaleString()}`;
}

function FeatureChecklist({ clientId, features, onAdd, onToggle, onDelete }) {
  const [text, setText] = useState('');

  function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(clientId, text.trim());
    setText('');
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      <div className="text-xs font-semibold tracking-wide text-gray-400 mb-2">FEATURES</div>
      <div className="space-y-1.5 mb-2">
        {features.map((f) => (
          <div key={f.id} className="flex items-center gap-2 group">
            <button onClick={() => onToggle(f)} className="text-gray-400 hover:text-emerald-500 shrink-0">
              {f.done ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Circle size={15} />}
            </button>
            <span className={`text-sm flex-1 ${f.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>{f.title}</span>
            <button
              onClick={() => onDelete(f.id)}
              className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {features.length === 0 && <div className="text-xs text-gray-400">No features requested yet.</div>}
      </div>
      <form onSubmit={submit} className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a feature request..."
          className="flex-1 px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        />
        <button type="submit" className="p-1.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-pink text-white">
          <Check size={14} />
        </button>
      </form>
    </div>
  );
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  function refresh() {
    client.get('/clients').then((res) => setClients(res.data));
    client.get('/projects').then((res) => setProjects(res.data));
  }

  useEffect(() => {
    refresh();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(c) {
    setEditing(c);
    setForm({ ...EMPTY_FORM, ...c, project_id: c.project_id || '' });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, project_id: form.project_id || null };
    if (editing) {
      await client.put(`/clients/${editing.id}`, payload);
    } else {
      await client.post('/clients', payload);
    }
    setShowModal(false);
    refresh();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this client? Their feature list will be removed too.')) return;
    await client.delete(`/clients/${id}`);
    refresh();
  }

  async function addFeature(clientId, title) {
    await client.post(`/clients/${clientId}/features`, { title });
    refresh();
  }

  async function toggleFeature(feature) {
    await client.put(`/clients/features/${feature.id}`, { done: feature.done ? 0 : 1 });
    refresh();
  }

  async function deleteFeature(featureId) {
    await client.delete(`/clients/features/${featureId}`);
    refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">Your active clients, with a running list of feature requests for each.</p>
        <button onClick={openCreate} className="btn-gradient flex items-center gap-1.5 text-sm">
          <Plus size={15} /> Add Client
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clients.map((c) => {
          const linkedProject = projects.find((p) => p.id === c.project_id);
          return (
            <div key={c.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{c.name}</div>
                  {(c.contact_name || c.contact_email) && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      {c.contact_name}
                      {c.contact_name && c.contact_email ? ' · ' : ''}
                      {c.contact_email}
                    </div>
                  )}
                  {linkedProject && (
                    <div className="badge bg-brand-purple/10 text-brand-purple dark:text-brand-purple2 mt-2 w-fit">
                      {linkedProject.name} · {currency(linkedProject.value)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {c.notes && <div className="text-xs text-gray-400 mt-2 line-clamp-2">{c.notes}</div>}

              <FeatureChecklist
                clientId={c.id}
                features={c.features || []}
                onAdd={addFeature}
                onToggle={toggleFeature}
                onDelete={deleteFeature}
              />
            </div>
          );
        })}
        {clients.length === 0 && (
          <div className="card p-8 text-center text-gray-400 md:col-span-2">No clients yet. Add your first one above.</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editing ? 'Edit Client' : 'Add Client'}</h3>
              <button onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                placeholder="Client / company name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Contact name (optional)"
                  value={form.contact_name}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                />
                <input
                  placeholder="Contact email (optional)"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <select
                value={form.project_id}
                onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              >
                <option value="">Link to a project (optional)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.company ? `(${p.company})` : ''}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                rows={3}
              />
              <button type="submit" className="w-full btn-gradient justify-center flex py-2.5">
                {editing ? 'Save Changes' : 'Add Client'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
