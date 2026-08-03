import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { useChat } from '../context/ChatContext.jsx';

export default function ChatPanel() {
  const { open, setOpen, messages, loading, send } = useChat();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    send(input);
    setInput('');
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[380px] max-w-[92vw] h-[520px] max-h-[75vh] flex flex-col card overflow-hidden">
      <div className="bg-gradient-to-r from-brand-purple to-brand-pink px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 font-medium">
          <Sparkles size={16} />
          Chat with Soblait
        </div>
        <button onClick={() => setOpen(false)} className="hover:opacity-80">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-950">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap text-sm rounded-2xl px-3 py-2 ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white rounded-br-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-sm'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-gray-400">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Soblait anything..."
          className="flex-1 px-3 py-2 text-sm rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
        />
        <button type="submit" className="w-9 h-9 rounded-full btn-gradient flex items-center justify-center px-0">
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
