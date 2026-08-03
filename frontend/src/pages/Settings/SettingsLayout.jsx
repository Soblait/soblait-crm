import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const GENERAL = [
  { to: '/settings/team', label: 'Team & Users' },
  { to: '/settings/audit-log', label: 'Audit Log' },
];

const SYSTEM = [
  { to: '/settings/stages', label: 'Pipeline Stages' },
  { to: '/settings/tags', label: 'System Tags' },
  { to: '/settings/onboarding-templates', label: 'Onboarding Templates' },
  { to: '/settings/integrations', label: 'Integrations' },
  { to: '/settings/email-templates', label: 'Email Templates' },
];

export default function SettingsLayout({ children }) {
  return (
    <div className="flex gap-6 items-start">
      <aside className="w-64 shrink-0 card p-4 space-y-5">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-purple">
          <ArrowLeft size={15} /> Dashboard Overview
        </Link>
        <div>
          <div className="text-[11px] font-semibold tracking-wider text-gray-400 mb-2 px-1">GENERAL</div>
          <nav className="space-y-1">
            {GENERAL.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm ${
                    isActive ? 'bg-brand-purple/10 text-brand-purple dark:text-brand-purple2 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div>
          <div className="text-[11px] font-semibold tracking-wider text-gray-400 mb-2 px-1">SYSTEM SETTINGS</div>
          <nav className="space-y-1">
            {SYSTEM.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm ${
                    isActive ? 'bg-brand-purple/10 text-brand-purple dark:text-brand-purple2 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
