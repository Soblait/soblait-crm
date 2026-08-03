import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, RefreshCw, X } from 'lucide-react';
import client from '../api/client';

function pad(n) {
  return String(n).padStart(2, '0');
}

function toKey(y, m, d) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

export default function Calendar() {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [closes, setCloses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ title: '', date: toKey(today.getFullYear(), today.getMonth(), today.getDate()) });

  function refresh() {
    client.get('/calendar').then((res) => {
      setEvents(res.data.events);
      setTasks(res.data.tasks);
      setCloses(res.data.closes);
    });
  }

  useEffect(() => {
    refresh();
  }, []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const chipsByDate = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      map[e.date] = map[e.date] || [];
      map[e.date].push({ label: e.title, color: 'bg-brand-purple' });
    });
    tasks.forEach((t) => {
      map[t.date] = map[t.date] || [];
      map[t.date].push({ label: t.title, color: 'bg-amber-500' });
    });
    closes.forEach((c) => {
      map[c.date] = map[c.date] || [];
      map[c.date].push({ label: `${c.title} closes`, color: 'bg-brand-pink' });
    });
    return map;
  }, [events, tasks, closes]);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  async function handleAdd(e) {
    e.preventDefault();
    await client.post('/calendar', { ...form, type: 'event' });
    setShowModal(false);
    refresh();
  }

  function syncGoogle() {
    setToast('Google Calendar sync is coming soon!');
    setTimeout(() => setToast(''), 3000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
          >
            Today
          </button>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
            <ChevronRight size={16} />
          </button>
          <h2 className="text-lg font-semibold ml-2">
            {cursor.toLocaleString('default', { month: 'long' })} {year}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={syncGoogle} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm flex items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800">
            <RefreshCw size={14} /> Sync Google Calendar
          </button>
          <button onClick={() => setShowModal(true)} className="btn-gradient flex items-center gap-1.5 text-sm">
            <Plus size={15} /> Add event
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-7 text-xs font-medium text-gray-400 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="px-2 py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, idx) => {
            const key = d ? toKey(year, month, d) : `empty-${idx}`;
            const chips = d ? chipsByDate[toKey(year, month, d)] || [] : [];
            const isToday =
              d && year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
            return (
              <div
                key={key}
                className={`min-h-[90px] rounded-lg border border-gray-100 dark:border-gray-800 p-1.5 ${
                  d ? '' : 'bg-transparent border-transparent'
                }`}
              >
                {d && (
                  <>
                    <div className={`text-xs mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white' : 'text-gray-500'}`}>
                      {d}
                    </div>
                    <div className="space-y-1">
                      {chips.slice(0, 3).map((c, i) => (
                        <div key={i} className={`text-[10px] text-white rounded px-1 py-0.5 truncate ${c.color}`}>
                          {c.label}
                        </div>
                      ))}
                      {chips.length > 3 && <div className="text-[10px] text-gray-400">+{chips.length - 3} more</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Add event</h3>
              <button onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                required
                placeholder="Event title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              />
              <input
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              />
              <button type="submit" className="w-full btn-gradient justify-center flex py-2.5">
                Add event
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
