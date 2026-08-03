import React, { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('soblait_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  async function login(email, password) {
    const { data } = await client.post('/auth/login', { email, password });
    localStorage.setItem('soblait_token', data.token);
    localStorage.setItem('soblait_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function register(name, email, password) {
    const { data } = await client.post('/auth/register', { name, email, password });
    localStorage.setItem('soblait_token', data.token);
    localStorage.setItem('soblait_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('soblait_token');
    localStorage.removeItem('soblait_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
