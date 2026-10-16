import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Admin() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      setUsers(await api('/admin/users'));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    if (!confirm('Видалити користувача разом з його журналами?')) return;
    try {
      await api(`/admin/users/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Користувачі системи</h1>
      {error && <p className="error">{error}</p>}
      {!users && !error && <p className="muted">Завантаження…</p>}
      {users && (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Журналів</th>
              <th>Створено</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.logs}</td>
                <td className="muted">{u.created_at}</td>
                <td>
                  <button className="btn ghost small" onClick={() => remove(u.id)}>
                    Видалити
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
