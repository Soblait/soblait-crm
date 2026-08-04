import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmContext = createContext(null);

// In-app replacement for the browser's native confirm() dialog. Native confirm() is jarring next
// to the rest of the app's styled modals, ignores dark mode, and can block/freeze the tab while
// open. This renders a normal React modal instead, and resolves a promise the same way
// window.confirm() would (true = confirmed, false = cancelled).
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { message, title, confirmLabel, danger }
  const resolveRef = useRef(null);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        message,
        title: options.title || 'Please confirm',
        confirmLabel: options.confirmLabel || 'Delete',
        danger: options.danger !== false,
      });
    });
  }, []);

  function handleChoice(result) {
    if (resolveRef.current) resolveRef.current(result);
    resolveRef.current = null;
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[100] p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-start gap-3 mb-5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  state.danger
                    ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                    : 'bg-brand-purple/10 text-brand-purple dark:text-brand-purple2'
                }`}
              >
                <AlertTriangle size={17} />
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">{state.title}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{state.message}</div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleChoice(false)}
                className="px-4 py-2 rounded-lg text-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleChoice(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
                  state.danger
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-gradient-to-r from-brand-purple to-brand-pink hover:opacity-90'
                }`}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

// Usage: const confirm = useConfirm(); if (!(await confirm('Delete this lead?'))) return;
export function useConfirm() {
  return useContext(ConfirmContext);
}
