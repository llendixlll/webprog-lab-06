import { createContext, useContext, useState } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem('pl_auth');
    return raw ? JSON.parse(raw) : null;
  });

  function persist(data) {
    localStorage.setItem('pl_auth', JSON.stringify(data));
    setAuth(data);
  }

  async function login(email, password) {
    persist(await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }));
  }

  async function register(email, password) {
    persist(await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }));
  }

  function logout() {
    localStorage.removeItem('pl_auth');
    setAuth(null);
  }

  return (
    <AuthContext.Provider value={{ auth, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
