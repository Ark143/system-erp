import { createContext, useContext, useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('access');
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = 'Bearer ' + token;
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const err = new Error(typeof data === 'string' ? data : data?.detail || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });
  const [rbac, setRbac] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rbac') || 'null');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
      const rbacRaw = localStorage.getItem('rbac');
      if (rbacRaw) setRbac(JSON.parse(rbacRaw));
    } catch {
      setUser(null);
      setRbac(null);
    }
  }, []);

  const login = async (email, password) => {
    const data = await request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    try {
      const rbacData = await request('/auth/rbac-routes/');
      localStorage.setItem('rbac', JSON.stringify(rbacData));
      setRbac(rbacData);
    } catch {
      localStorage.removeItem('rbac');
      setRbac(null);
    }
    return data;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setRbac(null);
  };

  return (
    <AuthContext.Provider value={{ user, rbac, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
