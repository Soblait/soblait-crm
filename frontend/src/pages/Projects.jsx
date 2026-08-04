import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, X, LayoutGrid, List as ListIcon, Columns3, CheckCircle2, Circle, Lightbulb, Smartphone, Briefcase } from 'lucide-react';
import client from '../api/client';

const EMPTY_FORM = {
  name: '',
  company: '',
  type: '',
  value: '',
  stage: '',
  category: 'project',
  demo_done: false,
  demo_date: '',
  notes: '',
  app_name: '',
  audience: '',
  publish_target: '',
};

const CATEGORIES = [
  { key: 'idea', label: 'Ideas', singular: 'Idea', icon: Lightbulb },
  { key: 'app', label: 'Apps', singular: 'App', icon: Smartphone },
  { key: 'project', label: 'Projects', singular: 'Project', icon: Briefcase },
];

function currency(n) {
  return `$${Number(n || 0).toLocaleString()}`;
}

export default function Projects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [stages, setStages] = useState([]);
  const [view, setView] = useState('board');
  const [activeTab, setActiveTab] = useState('project');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  function refresh() {
    client.get('/projects').then((res) => setProjects(res.data));
    client.get('/settings/stages').then((res) => setStages(res.data));
  }

  useEffect(() => {
    refresh();
  }, []);

  // Ideas / Apps / Projects are the same underlying pipeline (idea -> demo -> active -> won ->
  // lost), just split into separate areas by what kind of thing it fundamentally is. Fall back
  // to 'project' for any row that hasn't been categorized yet.
  const filtered = useMemo(() => projects.filter((p) => (p.category || 'project') === activeTab), [projects, activeTab]);

  const totalValue = useMemo(() => filtered.reduce((s, p) => s + p.value, 0), [filtered]);
  const inProgressCount = useMemo(() => filtered.filter((p) => p.stage === 'demo' || p.stage === 'active').length, [filtered]);
  const wonCount = useMemo(() => filtered.filter((p) => p.stage === 'won').length, [filtered]);

  function openCreate(overrides = {}) {
    setEditing(null);
    setForm({ ...EMPTY_FORM, stage: stages[0]?.name || 'idea', category: activeTab, ...overrides });
    setShowModal(true);
  }

  // Lets the sidebar's "+ New" quick-add jump straight here with the modal already open,
  // instead of requiring a click into Projects first and then another click to Add Project.
  useEffect(() => {
    const quickAdd = searchParams.get('new');
    if (quickAdd) {
      openCreate(quickAdd === '1' ? {} : { stage: quickAdd });
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, stages]);

  function openEdit(project) {
    setEditing(project);
    setForm({ ...EMPTY_FORM, ...project, demo_done: !!project.demo_done, demo_date: project.demo_date || '' });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, value: Number(form.value) || 0, demo_done: form.demo_done ? 1 : 0 };
    if (editing) {
      await client.put(`/projects/${editing.id}`, payload);
    } else {
      await client.post('/projects', payload);
    }
    setShowModal(false);
    refresh();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this project?')) return;
    await client.delete(`/projects/${id}`);
    refresh();
  }

  async function moveStage(project, newStage) {
    await client.put(`/projects/${project.id}`, { ...project, stage: newStage });
    refresh();
  }

  const activeCategory = CATEGORIES.find((c) => c.key === activeTab);

  return (
    <div className="space-y-5">
      <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden w-fit">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setActiveTab(c.key)}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 ${
              activeTab === c.key ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white' : 'bg-white dark:bg-gray-800 text-gray-500'
            }`}
          >
            <c.icon size={14} /> {c.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <div className="card px-4 py-2.5 text-sm">
            <span className="text-gray-400">Total Value</span>{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{currency(totalValue)}</span>
          </div>
          <div className="card px-4 py-2.5 text-sm">
            <span className="text-gray-400">In Progress</span>{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{inProgressCount}</span>
          </div>
          <div className="card px-4 py-2.5 text-sm">
            <span className="text-gray-400">Won</span>{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{wonCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {[
              { key: 'board', icon: Columns3, label: 'Board' },
              { key: 'kanban', icon: LayoutGrid, label: 'Kanban' },
              { key: 'list', icon: ListIcon, label: 'List' },
            ].map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`px-3 py-2 text-sm flex items-center gap-1.5 ${
                  view === v.key ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white' : 'bg-white dark:bg-gray-800 text-gray-500'
                }`}
              >
                <v.icon size={14} /> {v.label}
              </button>
            ))}
          </div>
          <button onClick={() => openCreate()} className="btn-gradient flex items-center gap-1.5 text-sm">
            <Plus size={15} /> Add {activeCategory.singular}
          </button>
        </div>
      </div>

      {(view === 'board' || view === 'kanban') && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(stages.length, 1)}, minmax(240px, 1fr))` }}>
          {stages.map((stage) => {
            const stageProjects = filtered.filter((p) => p.stage === stage.name);
            const stageValue = stageProjects.reduce((s, p) => s + p.value, 0);
            return (
              <div key={stage.id} className="card p-3 min-w-[240px]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="font-medium text-sm text-gray-700 dark:text-gray-200 capitalize">{stage.name}</div>
                  <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-500">{stageProjects.length}</span>
                </div>
                <div className="text-xs text-gray-400 px-1 mb-2">{currency(stageValue)}</div>
                <div className="space-y-2">
                  {stageProjects.map((p) => (
                    <div key={p.id} className="rounded-lg border border-gray-100 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-800/60">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-white">{p.name}</div>
                          <div className="text-xs text-gray-400">{p.company}</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-brand-purple">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-500">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm font-semibold mt-2 text-brand-purple dark:text-brand-purple2">{currency(p.value)}</div>
                      {p.type && <div className="text-xs text-gray-400 mt-1 capitalize">{p.type}</div>}
                      {p.app_name && <div className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">"{p.app_name}"{p.audience ? ` · ${p.audience}` : ''}</div>}
                      {p.publish_target && <div className="text-xs text-gray-400 mt-0.5">→ {p.publish_target}</div>}
                      <div className="flex items-center gap-1.5 text-xs mt-2 text-gray-500 dark:text-gray-400">
                        {p.demo_done ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Circle size={13} />}
                        {p.demo_done ? `Demo done${p.demo_date ? ` (${p.demo_date})` : ''}` : 'No demo yet'}
                      </div>
                      {p.notes && <div className="text-xs text-gray-400 mt-1 line-clamp-2">{p.notes}</div>}
                      {view === 'kanban' && (
                        <select
                          value={p.stage}
                          onChange={(e) => moveStage(p, e.target.value)}
                          className="mt-2 w-full text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 capitalize"
                        >
                          {stages.map((s) => (
                            <option key={s.id} value={s.name} className="capitalize">
                              Move to {s.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'list' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Demo</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.company}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize">{p.type}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{currency(p.value)}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-brand-purple/10 text-brand-purple dark:text-brand-purple2 capitalize">{p.stage}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.demo_done ? `Done${p.demo_date ? ` (${p.demo_date})` : ''}` : 'Not yet'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-400">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No {activeCategory.label.toLowerCase()} yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editing ? `Edit ${activeCategory.singular}` : `Add ${activeCategory.singular}`}</h3>
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

              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setForm({ ...form, category: c.key })}
                    className={`flex-1 py-2 text-sm flex items-center justify-center gap-1.5 ${
                      form.category === c.key ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white' : 'bg-white dark:bg-gray-800 text-gray-500'
                    }`}
                  >
                    <c.icon size={14} /> {c.singular}
                  </button>
                ))}
              </div>

              <input
                placeholder="Company / Client (optional)"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Type (app, website, ...)"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                />
                <input
                  type="number"
                  placeholder="Value ($)"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                />
              </div>

              <div className="text-[11px] font-semibold tracking-wider text-gray-400 pt-1">
                APP DETAILS (OPTIONAL)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="App / product name"
                  value={form.app_name}
                  onChange={(e) => setForm({ ...form, app_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                />
                <input
                  placeholder="Audience"
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <input
                placeholder="Where we'll upload it (App Store, Google Play, web host, ...)"
                value={form.publish_target}
                onChange={(e) => setForm({ ...form, publish_target: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              />

              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 capitalize"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.name} className="capitalize">
                    {s.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.demo_done}
                    onChange={(e) => setForm({ ...form, demo_done: e.target.checked })}
                    className="rounded"
                  />
                  Demo done
                </label>
                <input
                  type="date"
                  disabled={!form.demo_done}
                  value={form.demo_date || ''}
                  onChange={(e) => setForm({ ...form, demo_date: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 disabled:opacity-50"
                />
              </div>
              <textarea
                placeholder="Notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <button type="submit" className="flex-1 btn-gradient justify-center flex py-2.5">
                  {editing ? 'Save Changes' : `Create ${activeCategory.singular}`}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      handleDelete(editing.id);
                    }}
                    title="Delete project"
                    className="px-3 py-2.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
