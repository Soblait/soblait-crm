import React, { useEffect, useState } from 'react';
import { Bot, Zap, PauseCircle, CheckCircle2, Mail, DollarSign, Trophy } from 'lucide-react';
import client from '../api/client';

const TEMPLATES = [
  { name: 'Welcome Email', desc: 'When a new lead is created, send a welcome email', icon: Mail },
  { name: 'Big Deal Alert', desc: 'When a project value exceeds $1,000,000, alert the team', icon: DollarSign },
  { name: 'Deal Won', desc: 'When a project moves to Won, notify the team and log revenue', icon: Trophy },
];

function StatCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tint}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <div className="text-sm text-gray-400">{label}</div>
        <div className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</div>
      </div>
    </div>
  );
}

export default function Automations() {
  const [rules, setRules] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, disabled: 0, successRate: 0 });
  const [log, setLog] = useState([]);
  const [tab, setTab] = useState('rules');

  function refresh() {
    client.get('/automations').then((res) => {
      setRules(res.data.rules);
      setStats(res.data.stats);
    });
    client.get('/automations/log').then((res) => setLog(res.data));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function toggleActive(rule) {
    await client.put(`/automations/${rule.id}`, { active: rule.active ? 0 : 1 });
    refresh();
  }

  async function useTemplate(name) {
    await client.post(`/automations/template/${encodeURIComponent(name)}`);
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard icon={Bot} label="Total Rules" value={stats.total} tint="bg-gradient-to-br from-brand-purple to-brand-purple2" />
        <StatCard icon={CheckCircle2} label="Active" value={stats.active} tint="bg-gradient-to-br from-emerald-400 to-emerald-600" />
        <StatCard icon={PauseCircle} label="Disabled" value={stats.disabled} tint="bg-gradient-to-br from-gray-400 to-gray-500" />
        <StatCard icon={Zap} label="Success Rate" value={`${stats.successRate}%`} tint="bg-gradient-to-br from-brand-pink to-rose-500" />
      </div>

      <div className="card p-5">
        <h3 className="font-medium text-gray-700 dark:text-gray-200 mb-3">Quick Templates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.name}
              onClick={() => useTemplate(t.name)}
              className="text-left rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:border-brand-purple/50 hover:bg-brand-purple/5 transition"
            >
              <div className="w-9 h-9 rounded-lg bg-brand-purple/10 flex items-center justify-center text-brand-purple mb-2">
                <t.icon size={16} />
              </div>
              <div className="font-medium text-sm text-gray-900 dark:text-white">{t.name}</div>
              <div className="text-xs text-gray-400 mt-1">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden w-fit">
        <button
          onClick={() => setTab('rules')}
          className={`px-4 py-2 text-sm ${tab === 'rules' ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white' : 'bg-white dark:bg-gray-800 text-gray-500'}`}
        >
          Active Rules
        </button>
        <button
          onClick={() => setTab('log')}
          className={`px-4 py-2 text-sm ${tab === 'log' ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white' : 'bg-white dark:bg-gray-800 text-gray-500'}`}
        >
          Execution Log
        </button>
      </div>

      {tab === 'rules' && (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {rules.map((rule) => (
            <div key={rule.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-sm text-gray-900 dark:text-white">{rule.name}</div>
                <div className="text-xs text-gray-400">{rule.trigger_desc}</div>
                <div className="text-xs text-gray-400 mt-1">Ran {rule.run_count} time(s)</div>
              </div>
              <button
                onClick={() => toggleActive(rule)}
                className={`px-3 py-1.5 text-xs rounded-full font-medium ${
                  rule.active
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {rule.active ? 'Active' : 'Disabled'}
              </button>
            </div>
          ))}
          {rules.length === 0 && <div className="p-8 text-center text-gray-400">No automation rules yet.</div>}
        </div>
      )}

      {tab === 'log' && (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {log.map((entry) => (
            <div key={entry.id} className="p-4">
              <div className="text-sm text-gray-800 dark:text-gray-100">{entry.message}</div>
              <div className="text-xs text-gray-400 mt-1">
                {entry.automation_name} • {entry.created_at}
              </div>
            </div>
          ))}
          {log.length === 0 && <div className="p-8 text-center text-gray-400">No executions logged yet.</div>}
        </div>
      )}
    </div>
  );
}
