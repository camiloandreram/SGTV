// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { apiService } from '../services/api'; // Asegúrate de importar apiService

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    if (!user?.idUsuario) return;
    try {
      const response = await apiService.obtenerUsuarioPorId(user.idUsuario);
      if (response.success) {
        setUser(response.user);
        sessionStorage.setItem('user', JSON.stringify(response.user));
      }
    } catch (error) {
      console.error('Error refrescando usuario:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};