import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, X, LayoutGrid, List as ListIcon, Columns3 } from 'lucide-react';
import client from '../api/client';

const EMPTY_FORM = { name: '', company: '', value: '', stage: '', close_date: '', notes: '' };

function currency(n) {
  return `$${Number(n || 0).toLocaleString()}`;
}

export default function Opportunities() {
  const [opps, setOpps] = useState([]);
  const [stages, setStages] = useState([]);
  const [view, setView] = useState('board');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  function refresh() {
    client.get('/opportunities').then((res) => setOpps(res.data));
    client.get('/settings/stages').then((res) => setStages(res.data));
  }

  useEffect(() => {
    refresh();
  }, []);

  const totalPipeline = useMemo(
    () => opps.filter((o) => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost').reduce((s, o) => s + o.value, 0),
    [opps]
  );
  const activeDeals = useMemo(
    () => opps.filter((o) => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost').length,
    [opps]
  );
  const closedWon = useMemo(() => opps.filter((o) => o.stage === 'Closed Won').length, [opps]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, stage: stages[0]?.name || 'New' });
    setShowModal(true);
  }

  function openEdit(opp) {
    setEditing(opp);
    setForm({ ...EMPTY_FORM, ...opp });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, value: Number(form.value) || 0 };
    if (editing) {
      await client.put(`/opportunities/${editing.id}`, payload);
    } else {
      await client.post('/opportunities', payload);
    }
    setShowModal(false);
    refresh();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this opportunity?')) return;
    await client.delete(`/opportunities/${id}`);
    refresh();
  }

  async function moveStage(opp, newStage) {
    await client.put(`/opportunities/${opp.id}`, { ...opp, stage: newStage });
    refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <div className="card px-4 py-2.5 text-sm">
            <span className="text-gray-400">Total Pipeline Value</span>{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{currency(totalPipeline)}</span>
          </div>
          <div className="card px-4 py-2.5 text-sm">
            <span className="text-gray-400">Active Deals</span>{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{activeDeals}</span>
          </div>
          <div className="card px-4 py-2.5 text-sm">
            <span className="text-gray-400">Closed Won</span>{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{closedWon}</span>
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
          <button onClick={openCreate} className="btn-gradient flex items-center gap-1.5 text-sm">
            <Plus size={15} /> Add Deal
          </button>
        </div>
      </div>

      {(view === 'board' || view === 'kanban') && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(stages.length, 1)}, minmax(220px, 1fr))` }}>
          {stages.map((stage) => {
            const stageOpps = opps.filter((o) => o.stage === stage.name);
            const stageValue = stageOpps.reduce((s, o) => s + o.value, 0);
            return (
              <div key={stage.id} className="card p-3 min-w-[220px]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="font-medium text-sm text-gray-700 dark:text-gray-200">{stage.name}</div>
                  <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-500">{stageOpps.length}</span>
                </div>
                <div className="text-xs text-gray-400 px-1 mb-2">{currency(stageValue)}</div>
                <div className="space-y-2">
                  {stageOpps.map((opp) => (
                    <div key={opp.id} className="rounded-lg border border-gray-100 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-800/60">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-white">{opp.name}</div>
                          <div className="text-xs text-gray-400">{opp.company}</div>
                        </div>
                        <button onClick={() => openEdit(opp)} className="text-gray-400 hover:text-brand-purple">
                          <Pencil size={13} />
                        </button>
                      </div>
                      <div className="text-sm font-semibold mt-2 text-brand-purple dark:text-brand-purple2">{currency(opp.value)}</div>
                      {opp.close_date && <div className="text-xs text-gray-400 mt-1">Closes {opp.close_date}</div>}
                      {view === 'kanban' && (
                        <select
                          value={opp.stage}
                          onChange={(e) => moveStage(opp, e.target.value)}
                          className="mt-2 w-full text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                        >
                          {stages.map((s) => (
                            <option key={s.id} value={s.name}>
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
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Close Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {opps.map((opp) => (
                <tr key={opp.id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{opp.name}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{opp.company}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{currency(opp.value)}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-brand-purple/10 text-brand-purple dark:text-brand-purple2">{opp.stage}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{opp.close_date}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(opp)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(opp.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-400">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editing ? 'Edit Opportunity' : 'Add Opportunity'}</h3>
              <button onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                placeholder="Deal name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              />
              <input
                placeholder="Company / Client"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Value ($)"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                />
                <input
                  type="date"
                  value={form.close_date || ''}
                  onChange={(e) => setForm({ ...form, close_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
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
                {editing ? 'Save Changes' : 'Create Opportunity'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
