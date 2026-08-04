import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Target,
  Zap,
  CalendarDays,
  CheckSquare,
  BarChart3,
  Bot,
  Sparkles,
  Settings,
  Moon,
  Sun,
  Plus,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/act-now', label: 'Act Now', icon: Zap },
  { to: '/calendar', label: 'Smart Calendar', icon: CalendarDays },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/automations', label: 'Automations', icon: Bot },
  { to: '/galaxy', label: 'Galaxy', icon: Sparkles },
];

const crmItems = [
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/projects', label: 'Projects', icon: Target },
];

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
          isActive
            ? 'bg-gradient-to-r from-brand-purple/10 to-brand-pink/10 text-brand-purple dark:text-brand-purple2'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`
      }
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { dark, toggleDark } = useTheme();
  const navigate = useNavigate();

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-5">
      <div className="flex items-center gap-3 px-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center text-white font-bold">
          S
        </div>
        <div>
          <div className="font-semibold text-gray-900 dark:text-white leading-tight">Soblait</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 leading-tight">Your CRM, simplified</div>
        </div>
      </div>

      <button
        onClick={() => navigate('/projects?new=1')}
        className="btn-gradient w-full justify-center flex items-center gap-1.5 text-sm mb-6"
      >
        <Plus size={15} /> New Idea / Project / App
      </button>

      <div className="flex-1 overflow-y-auto">
        <nav className="space-y-1 mb-6">
          {navItems.map((item) => (
            <NavItem key={item.label} {...item} />
          ))}
        </nav>

        <div className="px-2 text-[11px] font-semibold tracking-wider text-gray-400 dark:text-gray-500 mb-2">
          CRM
        </div>
        <nav className="space-y-1">
          {crmItems.map((item) => (
            <NavItem key={item.label} {...item} />
          ))}
        </nav>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
        <NavItem to="/settings" label="System Settings" icon={Settings} />
        <button
          onClick={toggleDark}
          className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <span className="flex items-center gap-3">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            Dark Mode
          </span>
          <span
            className={`w-9 h-5 rounded-full flex items-center px-0.5 transition ${
              dark ? 'bg-gradient-to-r from-brand-purple to-brand-pink justify-end' : 'bg-gray-300 justify-start'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white block" />
          </span>
        </button>
      </div>
    </aside>
  );
}
