import React, { useEffect, useState } from 'react';
import SettingsLayout from './SettingsLayout.jsx';
import client from '../../api/client';

export default function AuditLog() {
  const [log, setLog] = useState([]);

  useEffect(() => {
    client.get('/settings/audit-log').then((res) => setLog(res.data));
  }, []);

  return (
    <SettingsLayout>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Audit Log</h2>
        <p className="text-sm text-gray-400">
          Read-only history of system events, automatically logged whenever leads, projects, or tasks are created, updated, or deleted.
        </p>
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {log.map((entry) => (
            <div key={entry.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm text-gray-800 dark:text-gray-100">{entry.details}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {entry.action} • {entry.entity} #{entry.entity_id}
                </div>
              </div>
              <div className="text-xs text-gray-400 whitespace-nowrap">{entry.created_at}</div>
            </div>
          ))}
          {log.length === 0 && <div className="p-8 text-center text-gray-400">No events logged yet.</div>}
        </div>
      </div>
    </SettingsLayout>
  );
}
