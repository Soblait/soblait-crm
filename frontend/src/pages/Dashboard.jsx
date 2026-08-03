import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, DollarSign, Users, Trophy } from 'lucide-react';
import client from '../api/client';
import { useChat } from '../context/ChatContext.jsx';

const SUGGESTIONS = [
  'Summarize my pipeline',
  'What should I focus on today?',
  'Draft a follow-up email',
  'Find deals at risk',
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

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const { openWithMessage } = useChat();

  useEffect(() => {
    client.get('/dashboard/stats').then((res) => setStats(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-brand-purple via-brand-purple2 to-brand-pink p-8 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/10" />
        <div className="absolute bottom-0 right-24 w-32 h-32 rounded-full bg-white/10" />
        <div className="relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
            <Sparkles size={26} />
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold max-w-2xl">How can Soblait help you sell today?</h2>
          <p className="mt-2 text-white/85 max-w-xl text-sm md:text-base">
            Your AI sales assistant runs the pipeline, drafts outreach, and surfaces what needs attention — just ask.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => openWithMessage(s)}
                className="px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-sm backdrop-blur transition"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => openWithMessage()}
              className="px-4 py-2 rounded-full bg-white text-brand-purple font-medium text-sm flex items-center gap-2 hover:opacity-90"
            >
              <Sparkles size={15} />
              Chat with Soblait
            </button>
            <Link
              to="/act-now"
              className="px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-sm flex items-center gap-2"
            >
              <Zap size={15} />
              Act Now
            </Link>
            {stats && (
              <span className="px-4 py-2 rounded-full bg-white/15 text-sm">
                {stats.newLeadsToday} new lead{stats.newLeadsToday === 1 ? '' : 's'} today
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={stats ? `$${stats.totalRevenue.toLocaleString()}` : '—'}
          tint="bg-gradient-to-br from-emerald-400 to-emerald-600"
        />
        <StatCard
          icon={Users}
          label="Active Leads"
          value={stats ? stats.activeLeads : '—'}
          tint="bg-gradient-to-br from-brand-purple to-brand-purple2"
        />
        <StatCard
          icon={Trophy}
          label="Deals Won"
          value={stats ? stats.dealsWon : '—'}
          tint="bg-gradient-to-br from-brand-pink to-rose-500"
        />
      </div>
    </div>
  );
}
