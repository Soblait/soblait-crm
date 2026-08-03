import React, { useState } from 'react';
import { Globe2, Plus, X } from 'lucide-react';

export default function Galaxy() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="relative min-h-[60vh] flex flex-col items-center justify-center text-center card p-10">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center text-white mb-4">
        <Globe2 size={30} />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Galaxy</h2>
      <p className="text-gray-400 mt-1 max-w-md">Your connected universe of contacts and data</p>
      <p className="text-gray-400 mt-4">Galaxy is coming soon.</p>

      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full btn-gradient flex items-center justify-center shadow-lg"
      >
        <Plus size={22} />
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6 text-left opacity-90">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Add to Galaxy</h3>
              <button onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-400">This feature is coming soon. Check back later!</p>
            <button disabled className="w-full mt-4 py-2.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed">
              Coming soon
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
