// Клієнт реального часу ProcessLens. Коли користувач автентифікований, компонент
// під'єднується до WebSocket-сервера (Socket.io) тим самим JWT і показує спливні
// сповіщення про завершення аналізу журналу та критичні вузькі місця — події
// надсилає серверна частина.
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export default function Notifications() {
  const { auth } = useAuth();
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (!auth?.token) return;
    const socket = io(SOCKET_URL, { auth: { token: auth.token }, transports: ['websocket'] });

    const push = (toast) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, ...toast }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000);
    };

    socket.on('log:analyzed', (p) =>
      push({ icon: '📊', text: `Журнал «${p.name}» проаналізовано — вузьких місць: ${p.bottlenecks}` }),
    );
    socket.on('bottleneck:alert', (p) =>
      push({ icon: '🔴', text: `Критичне вузьке місце: «${p.activity}»`, crit: true }),
    );

    return () => socket.disconnect();
  }, [auth?.token]);

  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={'toast' + (t.crit ? ' crit' : '')}>
          <span className="toast-icon">{t.icon}</span>
          {t.text}
        </div>
      ))}
    </div>
  );
}
