import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// обмежує доступ до захищених сторінок
export default function ProtectedRoute({ children, adminOnly }) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (adminOnly && auth.user.role !== 'admin')
    return <Navigate to="/" replace />;
  return children;
}
