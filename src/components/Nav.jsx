import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Nav() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="nav">
      <Link to="/" className="brand">
        Process<span>Lens</span>
      </Link>
      <nav className="nav-links">
        {auth ? (
          <>
            <Link to="/">Журнали</Link>
            <Link to="/upload">Завантажити</Link>
            {auth.user.role === 'admin' && <Link to="/admin">Користувачі</Link>}
            <span className="nav-user">{auth.user.email}</span>
            <button
              className="btn ghost"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Вийти
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Вхід</Link>
            <Link to="/register">Реєстрація</Link>
          </>
        )}
      </nav>
    </header>
  );
}
