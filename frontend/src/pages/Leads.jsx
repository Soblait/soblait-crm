import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, X, Lightbulb, Rocket, ArrowUpRight } from 'lucide-react';
import client from '../api/client';

const STATUSES = ['new', 'contacted', 'qualified', 'unqualified'];
const STATUS_STYLE = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  contacted: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  qualified: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  unqualified: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

const EMPTY_FORM = { name: '', company: '', email: '', phone: '', status: 'new', source: 'website', notes: '' };

const CONVERT_EMPTY_FORM = { value: '', type: '', notes: '' };

export default function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [convertTarget, setConvertTarget] = useState(null); // { lead, stage }
  const [convertForm, setConvertForm] = useState(CONVERT_EMPTY_FORM);

  function refresh() {
    client.get('/leads').then((res) => setLeads(res.data));
    client.get('/projects').then((res) => setProjects(res.data));
  }

  useEffect(() => {
    refresh();
  }, []);

  const projectByLeadId = useMemo(() => {
    const map = {};
    projects.forEach((p) => {
      if (p.lead_id) map[p.lead_id] = p;
    });
    return map;
  }, [projects]);

  function openConvert(lead, stage) {
    setConvertTarget({ lead, stage });
    setConvertForm(CONVERT_EMPTY_FORM);
  }

  async function submitConvert(e) {
    e.preventDefault();
    const { lead, stage } = convertTarget;
    await client.post(`/leads/${lead.id}/convert`, {
      stage,
      value: Number(convertForm.value) || 0,
      type: convertForm.type,
      notes: convertForm.notes,
    });
    setConvertTarget(null);
    // Land straight on the board so there's no second trip to find and edit the new project.
    navigate('/projects');
  }

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const matchesQuery =
        !query ||
        l.name.toLowerCase().includes(query.toLowerCase()) ||
        (l.company || '').toLowerCase().includes(query.toLowerCase()) ||
        (l.email || '').toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [leads, query, statusFilter]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(lead) {
    setEditing(lead);
    setForm({ ...EMPTY_FORM, ...lead });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editing) {
      await client.put(`/leads/${editing.id}`, form);
    } else {
      await client.post('/leads', form);
    }
    setShowModal(false);
    refresh();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this lead?')) return;
    await client.delete(`/leads/${id}`);
    refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search leads..."
              className="pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button onClick={openCreate} className="btn-gradient flex items-center gap-1.5 text-sm">
          <Plus size={15} /> Add Lead
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100 dark:border-gray-800">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => {
              const convertedProject = projectByLeadId[lead.id];
              return (
                <tr key={lead.id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{lead.name}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{lead.company}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{lead.email}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_STYLE[lead.status] || ''}`}>{lead.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{lead.source}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{(lead.created_at || '').slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    {convertedProject ? (
                      <Link
                        to="/projects"
                        className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center gap-1 w-fit"
                      >
                        <ArrowUpRight size={12} /> View project
                      </Link>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openConvert(lead, 'idea')}
                          title="Convert to Idea"
                          className="px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1"
                        >
                          <Lightbulb size={12} /> Idea
                        </button>
                        <button
                          onClick={() => openConvert(lead, 'active')}
                          title="Convert to Project"
                          className="px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1"
                        >
                          <Rocket size={12} /> Project
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(lead)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(lead.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-400">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editing ? 'Edit Lead' : 'Add Lead'}</h3>
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
                placeholder="Company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              />
              <input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              />
              <input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Source"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <textarea
                placeholder="Notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                rows={3}
              />
              <button type="submit" className="w-full btn-gradient justify-center flex py-2.5">
                {editing ? 'Save Changes' : 'Create Lead'}
              </button>
            </form>
          </div>
        </div>
      )}

      {convertTarget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {convertTarget.stage === 'active' ? <Rocket size={17} /> : <Lightbulb size={17} />}
                Convert to {convertTarget.stage === 'active' ? 'Project' : 'Idea'}
              </h3>
              <button onClick={() => setConvertTarget(null)}>
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {convertTarget.lead.name} ({convertTarget.lead.company || 'no company'})
            </p>
            <form onSubmit={submitConvert} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Type (app, website, ...)"
                  value={convertForm.type}
                  onChange={(e) => setConvertForm({ ...convertForm, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                />
                <input
                  type="number"
                  placeholder="Value ($)"
                  value={convertForm.value}
                  onChange={(e) => setConvertForm({ ...convertForm, value: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <textarea
                placeholder="Notes (optional)"
                value={convertForm.notes}
                onChange={(e) => setConvertForm({ ...convertForm, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                rows={3}
              />
              <button type="submit" className="w-full btn-gradient justify-center flex py-2.5">
                Create {convertTarget.stage === 'active' ? 'Project' : 'Idea'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
