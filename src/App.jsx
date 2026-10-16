import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import ProtectedRoute from './components/ProtectedRoute';
import Notifications from './realtime';

// Розбиття коду за маршрутами: кожна сторінка вантажиться окремим чанком лише
// при переході на неї. Важка сторінка аналізу (vis-network + графіки) та інші
// виносяться з головного бандла, тож перший екран лишається легким.
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Upload = lazy(() => import('./pages/Upload'));
const Analysis = lazy(() => import('./pages/Analysis'));
const Admin = lazy(() => import('./pages/Admin'));

export default function App() {
  return (
    <>
      <Nav />
      <main className="container">
        <Suspense fallback={<div className="loading">Завантаження…</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logs/:id"
              element={
                <ProtectedRoute>
                  <Analysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </main>
      <Notifications />
    </>
  );
}
