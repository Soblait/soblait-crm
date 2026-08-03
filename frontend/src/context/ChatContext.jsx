import React, { createContext, useContext, useState, useCallback } from 'react';
import client from '../api/client';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm your Soblait AI assistant. Ask me to summarize your pipeline, tell you what to focus on today, draft a follow-up email, or find deals at risk." },
  ]);
  const [loading, setLoading] = useState(false);

  const send = useCallback(async (text) => {
    if (!text || !text.trim()) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      const { data } = await client.post('/dashboard/chat', { message: text });
      setMessages((m) => [...m, { role: 'assistant', text: data.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: 'Sorry, something went wrong reaching the assistant.' }]);
    } finally {
      setLoading(false);
    }
  }, []);

  const openWithMessage = useCallback(
    (text) => {
      setOpen(true);
      if (text) send(text);
    },
    [send]
  );

  return (
    <ChatContext.Provider value={{ open, setOpen, messages, loading, send, openWithMessage }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
