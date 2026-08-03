import React, { useState } from 'react';
import { Search, Sparkles, Moon, Sun, Bell } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Topbar({ title, onAskAI }) {
  const { dark, toggleDark } = useTheme();
  const [query, setQuery] = useState('');

  return (
    <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between gap-4">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white whitespace-nowrap">{title}</h1>

      <div className="flex-1 max-w-md relative hidden md:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search leads, opportunities..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
        />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={onAskAI} className="btn-gradient flex items-center gap-1.5 text-sm">
          <Sparkles size={15} />
          Ask AI
        </button>
        <button
          onClick={toggleDark}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-pink" />
        </button>
      </div>
    </div>
  );
}
