import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

// коректне відмінювання «вузьке місце»
function pluralBn(n) {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return `${n} вузьке місце`;
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return `${n} вузьких місця`;
  return `${n} вузьких місць`;
}

export default function Dashboard() {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const navigate = useNavigate();

  async function load() {
    setError('');
    try {
      setLogs(await api('/logs'));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    if (!confirm('Видалити журнал?')) return;
    await api(`/logs/${id}`, { method: 'DELETE' });
    load();
  }

  // Підключення живого джерела — системи обліку Rezanok (staging).
  async function connectRezanok() {
    setError('');
    setConnecting(true);
    try {
      const res = await api('/logs/connect', { method: 'POST', body: '{}' });
      navigate(`/logs/${res.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Мої журнали операцій</h1>
        <div className="head-actions">
          <button className="btn ghost" onClick={connectRezanok} disabled={connecting}>
            {connecting ? 'Підключення…' : '🔌 Підключити Rezanok'}
          </button>
          <Link to="/upload" className="btn">
            + Завантажити журнал
          </Link>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {!logs && !error && <p className="muted">Завантаження…</p>}
      {logs && logs.length === 0 && (
        <p className="muted">
          Журналів ще немає. Завантажте перший CSV-файл для аналізу.
        </p>
      )}

      <div className="cards">
        {logs?.map((l) => (
          <div key={l.id} className="card">
            <div className="card-body">
              <h3>
                {l.source_type === 'rezanok' && <span className="live-tag">● LIVE</span>}
                {l.name}
              </h3>
              <p className="muted">
                {l.events_count} подій · {l.cases_count} кейсів ·{' '}
                <span className={l.bottlenecks ? 'accent' : ''}>
                  {pluralBn(l.bottlenecks)}
                </span>
              </p>
              <p className="muted small">{l.uploaded_at}</p>
            </div>
            <div className="card-actions">
              <Link to={`/logs/${l.id}`} className="btn small">
                Відкрити ▸
              </Link>
              <button className="btn ghost small" onClick={() => remove(l.id)}>
                Видалити
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
