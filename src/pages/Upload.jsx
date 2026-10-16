import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUpload } from '../api';

export default function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', name || file.name);
      const res = await apiUpload('/logs', fd);
      navigate(`/logs/${res.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card wide">
      <h1>Завантаження журналу</h1>
      <p className="muted">
        Формат CSV з колонками <code>case_id</code>, <code>activity</code>,{' '}
        <code>ts</code> та (необов’язково) <code>resource</code>. Часова
        позначка — у форматі <code>РРРР-ММ-ДД ГГ:ХХ</code>.
      </p>
      <form onSubmit={submit}>
        <label>
          Назва журналу
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="напр., Оброблення замовлень, березень 2026" />
        </label>
        <label>
          Файл CSV
          <input type="file" accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files[0])} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={busy || !file}>
          {busy ? 'Аналіз…' : 'Завантажити та проаналізувати'}
        </button>
      </form>
    </div>
  );
}
