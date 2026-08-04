import React, { useEffect, useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import SettingsLayout from './SettingsLayout.jsx';
import client from '../../api/client';
import { useConfirm } from '../../context/ConfirmContext.jsx';

export default function PipelineStages() {
  const confirm = useConfirm();
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newStage, setNewStage] = useState('');

  function refresh() {
    client.get('/settings/stages').then((res) => setStages(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function rename(stage, name) {
    await client.put(`/settings/stages/${stage.id}`, { name });
    refresh();
  }

  async function addStage(e) {
    e.preventDefault();
    if (!newStage.trim()) return;
    await client.post('/settings/stages', { name: newStage.trim() });
    setNewStage('');
    refresh();
  }

  async function removeStage(id) {
    if (!(await confirm('Delete this stage? Projects in this stage will keep their existing value.'))) return;
    await client.delete(`/settings/stages/${id}`);
    refresh();
  }

  async function move(index, direction) {
    const newOrder = [...stages];
    const target = index + direction;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];
    setStages(newOrder);
    await client.post('/settings/stages/reorder', { order: newOrder.map((s) => s.id) });
    refresh();
  }

  return (
    <SettingsLayout>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Pipeline Stages</h2>
        <p className="text-sm text-gray-400">
          Rename, reorder, add, or remove stages. Changes here immediately affect the columns shown on the Projects page.
          The dashboard's Total Revenue and Deals Won still key off the "won" stage specifically, so keep one stage
          representing delivered/paid work.
        </p>

        {loading && (
          <div className="card p-8 text-center text-gray-400 flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading stages…
          </div>
        )}

        {!loading && (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {stages.map((stage, i) => (
            <div key={stage.id} className="p-4 flex items-center gap-3">
              <span className="text-xs text-gray-400 w-6">{i + 1}</span>
              <input
                value={stage.name}
                onChange={(e) => setStages(stages.map((s) => (s.id === stage.id ? { ...s, name: e.target.value } : s)))}
                onBlur={(e) => rename(stage, e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
              />
              <button onClick={() => move(i, -1)} className="text-gray-400 hover:text-brand-purple">
                <ArrowUp size={15} />
              </button>
              <button onClick={() => move(i, 1)} className="text-gray-400 hover:text-brand-purple">
                <ArrowDown size={15} />
              </button>
              <button onClick={() => removeStage(stage.id)} className="text-gray-400 hover:text-red-400">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        )}

        <form onSubmit={addStage} className="flex items-center gap-2">
          <input
            placeholder="New stage name"
            value={newStage}
            onChange={(e) => setNewStage(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
          />
          <button type="submit" className="btn-gradient flex items-center gap-1.5 text-sm">
            <Plus size={15} /> Add Stage
          </button>
        </form>
      </div>
    </SettingsLayout>
  );
}
