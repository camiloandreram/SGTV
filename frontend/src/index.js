// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import TimeReporting from './components/TimeReporting/TimeReporting';
import Vacations from './components/Vacations/Vacations';
import UserList from './components/Employees/UserList';
import CreateUser from './components/Employees/CreateUser';
import EditUser from './components/Employees/EditUser';
import ForgotPassword from './components/ForgotPassword/ForgotPassword';
import ResetPassword from './components/ResetPassword/ResetPassword';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Rutas protegidas */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/reporte-horas" element={<TimeReporting />} />
            <Route path="/vacaciones" element={<Vacations />} />
            <Route path="/empleados" element={<UserList />} />
            <Route path="/empleados/nuevo" element={<CreateUser />} />
            <Route path="/empleados/editar/:id" element={<EditUser />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);