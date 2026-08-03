import React, { useEffect, useState } from 'react';
import { Plug } from 'lucide-react';
import SettingsLayout from './SettingsLayout.jsx';
import client from '../../api/client';

export default function Integrations() {
  const [integrations, setIntegrations] = useState([]);

  function refresh() {
    client.get('/settings/integrations').then((res) => setIntegrations(res.data));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function toggle(integration) {
    await client.put(`/settings/integrations/${integration.id}`, { connected: integration.connected ? 0 : 1 });
    refresh();
  }

  return (
    <SettingsLayout>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Integrations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {integrations.map((i) => (
            <div key={i.id} className="card p-5 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple shrink-0">
                  <Plug size={18} />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{i.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{i.description}</div>
                </div>
              </div>
              <button
                onClick={() => toggle(i)}
                className={`px-3 py-1.5 text-xs rounded-full font-medium shrink-0 ${
                  i.connected
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {i.connected ? 'Connected' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </SettingsLayout>
  );
}
