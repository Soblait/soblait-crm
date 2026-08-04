import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Download, Target, Trophy, DollarSign, Loader2 } from 'lucide-react';
import client from '../api/client';

const RANGES = ['All Time', 'This Month', 'This Quarter'];

function inRange(dateStr, range) {
  if (range === 'All Time' || !dateStr) return true;
  const d = new Date(dateStr);
  const now = new Date();
  if (range === 'This Month') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  if (range === 'This Quarter') {
    const q = Math.floor(now.getMonth() / 3);
    const dq = Math.floor(d.getMonth() / 3);
    return d.getFullYear() === now.getFullYear() && dq === q;
  }
  return true;
}

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

export default function Reports() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState('All Time');

  useEffect(() => {
    client.get('/reports').then((res) => setData(res.data));
  }, []);

  const filteredProjects = useMemo(() => {
    if (!data) return [];
    return data.projects.filter((p) => inRange(p.close_date || p.created_at, range));
  }, [data, range]);

  const stageChartData = useMemo(() => {
    if (!data) return [];
    const stages = {};
    filteredProjects.forEach((p) => {
      stages[p.stage] = (stages[p.stage] || 0) + p.value;
    });
    return Object.entries(stages).map(([stage, value]) => ({
      stage: stage ? stage.charAt(0).toUpperCase() + stage.slice(1) : stage,
      value,
    }));
  }, [filteredProjects, data]);

  const activeProjects = filteredProjects.filter((p) => p.stage === 'active').length;
  const wonProjects = filteredProjects.filter((p) => p.stage === 'won').length;
  const totalRevenue = filteredProjects.filter((p) => p.stage === 'won').reduce((s, p) => s + p.value, 0);

  function exportCsv() {
    const header = ['Name', 'Company', 'Value', 'Stage', 'Close Date'];
    const rows = filteredProjects.map((p) => [p.name, p.company, p.value, p.stage, p.close_date || '']);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soblait-report-${range.replace(/\s+/g, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-2 text-sm ${
                range === r ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white' : 'bg-white dark:bg-gray-800 text-gray-500'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <button onClick={exportCsv} className="btn-gradient flex items-center gap-1.5 text-sm">
          <Download size={15} /> Export Excel
        </button>
      </div>

      {data === null ? (
        <div className="card p-8 text-center text-gray-400 flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading reports…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={Target} label="Active Projects" value={activeProjects} tint="bg-gradient-to-br from-brand-purple to-brand-purple2" />
            <StatCard icon={Trophy} label="Won Projects" value={wonProjects} tint="bg-gradient-to-br from-emerald-400 to-emerald-600" />
            <StatCard icon={DollarSign} label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} tint="bg-gradient-to-br from-brand-pink to-rose-500" />
          </div>

          <div className="card p-5">
            <h3 className="font-medium text-gray-700 dark:text-gray-200 mb-4">Projects by Stage</h3>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={stageChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                  <Bar dataKey="value" fill="#a855f7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
