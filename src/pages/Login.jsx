import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('analyst@processlens.local');
  const [password, setPassword] = useState('analyst123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>Вхід</h1>
      <form onSubmit={submit}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)}
            type="email" required />
        </label>
        <label>
          Пароль
          <input value={password} onChange={(e) => setPassword(e.target.value)}
            type="password" required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={busy}>
          {busy ? 'Вхід…' : 'Увійти'}
        </button>
      </form>
      <p className="muted">
        Немає акаунта? <Link to="/register">Зареєструватися</Link>
      </p>
    </div>
  );
}
