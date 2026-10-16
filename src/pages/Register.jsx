import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>Реєстрація</h1>
      <form onSubmit={submit}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)}
            type="email" required />
        </label>
        <label>
          Пароль (мінімум 6 символів)
          <input value={password} onChange={(e) => setPassword(e.target.value)}
            type="password" minLength={6} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={busy}>
          {busy ? 'Реєстрація…' : 'Створити акаунт'}
        </button>
      </form>
      <p className="muted">
        Уже маєте акаунт? <Link to="/login">Увійти</Link>
      </p>
    </div>
  );
}
