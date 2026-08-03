import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, UserX, Check, Zap } from 'lucide-react';
import client from '../api/client';

const ICONS = {
  task_overdue: Clock,
  opportunity_closing_soon: Zap,
  opportunity_overdue: AlertTriangle,
  lead_not_contacted: UserX,
};

const PRIORITY_STYLE = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

export default function ActNow() {
  const [items, setItems] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  function refresh() {
    client.get('/act-now').then((res) => setItems(res.data));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function markDone(id) {
    await client.post(`/act-now/${id}/done`);
    setDismissed((d) => [...d, id]);
    refresh();
  }

  function snooze(id) {
    setDismissed((d) => [...d, id]);
  }

  const visible = items.filter((i) => !dismissed.includes(i.id));

  return (
    <div className="space-y-4">
      <div className="card p-5 bg-gradient-to-r from-brand-purple/5 to-brand-pink/5">
        <div className="flex items-center gap-2 font-medium text-gray-800 dark:text-gray-100">
          <Zap size={18} className="text-brand-purple" />
          Next best actions
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Computed from overdue tasks, deals closing soon, and leads waiting on outreach.
        </p>
      </div>

      {visible.length === 0 && (
        <div className="card p-8 text-center text-gray-400">You're all caught up. Nothing urgent right now.</div>
      )}

      <div className="space-y-3">
        {visible.map((item) => {
          const Icon = ICONS[item.type] || Zap;
          return (
            <div key={item.id} className="card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm">{item.title}</div>
                  <div className="text-xs text-gray-400">{item.detail}</div>
                </div>
                <span className={`badge ${PRIORITY_STYLE[item.priority] || ''}`}>{item.priority}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => snooze(item.id)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Snooze
                </button>
                <button
                  onClick={() => markDone(item.id)}
                  className="px-3 py-1.5 text-xs rounded-lg btn-gradient flex items-center gap-1"
                >
                  <Check size={13} /> Mark done
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
