import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import ChatPanel from './ChatPanel.jsx';
import { ChatProvider, useChat } from '../context/ChatContext.jsx';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/opportunities': 'Opportunities',
  '/act-now': 'Act Now',
  '/calendar': 'Smart Calendar',
  '/tasks': 'Tasks',
  '/reports': 'Reports & Analytics',
  '/automations': 'Automations',
  '/galaxy': 'Galaxy',
  '/settings': 'System Settings',
};

function InnerLayout() {
  const location = useLocation();
  const { openWithMessage } = useChat();
  const base = '/' + (location.pathname.split('/')[1] || 'dashboard');
  const title = TITLES[base] || 'Soblait';

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Topbar title={title} onAskAI={() => openWithMessage()} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
      <ChatPanel />
    </div>
  );
}

export default function Layout() {
  return (
    <ChatProvider>
      <InnerLayout />
    </ChatProvider>
  );
}
