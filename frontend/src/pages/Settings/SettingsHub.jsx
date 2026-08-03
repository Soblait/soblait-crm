import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ScrollText, Columns3, Tag, FileText, Plug, Mail } from 'lucide-react';
import SettingsLayout from './SettingsLayout.jsx';

const CARDS = [
  { to: '/settings/team', label: 'Team & Users', desc: 'Manage who has access to Soblait', icon: Users },
  { to: '/settings/audit-log', label: 'Audit Log', desc: 'Read-only history of system events', icon: ScrollText },
  { to: '/settings/stages', label: 'Pipeline Stages', desc: 'Customize your opportunity stages', icon: Columns3 },
  { to: '/settings/tags', label: 'System Tags', desc: 'Manage tags used on leads & deals', icon: Tag },
  { to: '/settings/onboarding-templates', label: 'Onboarding Templates', desc: 'Reusable onboarding checklists', icon: FileText },
  { to: '/settings/integrations', label: 'Integrations', desc: 'Connect Slack, HubSpot & more', icon: Plug },
  { to: '/settings/email-templates', label: 'Email Templates', desc: 'Manage outreach email templates', icon: Mail },
];

export default function SettingsHub() {
  return (
    <SettingsLayout>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map((c) => (
          <Link key={c.to} to={c.to} className="card p-5 hover:border-brand-purple/40 hover:shadow-md transition block">
            <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple mb-3">
              <c.icon size={18} />
            </div>
            <div className="font-medium text-gray-900 dark:text-white">{c.label}</div>
            <div className="text-xs text-gray-400 mt-1">{c.desc}</div>
          </Link>
        ))}
      </div>
    </SettingsLayout>
  );
}
