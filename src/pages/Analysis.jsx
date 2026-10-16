import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import ProcessMap from '../components/ProcessMap';
import { Sparkline, AreaChart, Histogram } from '../components/charts';
import { dur, num, pct, SEV, monthLabel } from '../format';

export default function Analysis() {
  const { id } = useParams();
  const { auth } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);

  async function loadDashboard() {
    setError('');
    try { setData(await api(`/logs/${id}/dashboard`)); }
    catch (err) { setError(err.message); }
  }

  useEffect(() => { loadDashboard(); }, [id]);

  // Повторно перечитати поточний стан процесу з Rezanok і перерахувати аналіз.
  async function sync() {
    setSyncing(true);
    try {
      await api(`/logs/${id}/sync`, { method: 'POST' });
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Завантаження аналітики…</p>;

  const { log, kpis, graph, bottlenecks, histogram, cumulative, rework, threshold } = data;
  const maxWait = Math.max(...bottlenecks.map((b) => b.avgWait), 1);
  const flow = cumulative.series.slice(1).map((v, i) => v - cumulative.series[i]);

  const confStatus = kpis.conformance >= 0.8 ? 'none' : kpis.conformance >= 0.5 ? 'medium' : 'high';
  const cells = [
    { label: 'Середній цикл кейсу', value: dur(kpis.avgCycleMin), sub: 'наскрізний час', sev: 'medium' },
    { label: 'Пропускна здатність', value: `${num(kpis.throughput)}`, unit: 'кейс/тиж', sub: 'потік завершень', sev: 'none', spark: flow, sparkColor: 'var(--green)' },
    { label: 'Вузьких місць', value: `${kpis.bottlenecks}`, unit: `із ${kpis.totalActivities} етапів`, sub: kpis.bottlenecks ? 'потребує уваги' : 'усе в нормі', sev: kpis.bottlenecks ? 'high' : 'none' },
    { label: 'Відповідність моделі', value: pct(kpis.conformance), sub: 'кейсів без повернень', sev: confStatus },
  ];

  const top = bottlenecks[0];
  const ratio = top ? (top.avgWait / Math.max(threshold, 1)) : 0;

  return (
    <div className="cockpit">
      {/* заголовок журналу */}
      <div className="ck-head">
        <div>
          <h1>{log.name}</h1>
          <div className="ck-meta">
            активних кейсів {num(kpis.nCases)} · подій {num(kpis.nEvents)} ·
            період {monthLabel(cumulative.start)} — {monthLabel(cumulative.end)}
          </div>
        </div>
        <div className="ck-head-right">
          {log.source_type === 'rezanok' && (
            <button className="btn ghost small" onClick={sync} disabled={syncing}>
              {syncing ? 'Синхронізація…' : '⟳ Оновити з Rezanok'}
            </button>
          )}
          <div className="ck-role">
            <span className="dot-acc" /> {auth?.user.role === 'admin' ? 'Адміністратор' : 'Аналітик'}
          </div>
        </div>
      </div>

      {/* KPI-стрічка */}
      <div className="kpi-strip">
        {cells.map((c, i) => (
          <div className="kpi-cell" key={i}>
            <div className="kpi-top">
              <span className="dot" style={{ background: SEV[c.sev].color }} />
              <span className="kpi-label">{c.label}</span>
              {c.spark && <div className="kpi-spark"><Sparkline values={c.spark} color={c.sparkColor} /></div>}
            </div>
            <div className="kpi-val" style={c.sev === 'high' ? { color: 'var(--red)' } : null}>
              {c.value}{c.unit && <span className="kpi-unit">{c.unit}</span>}
            </div>
            <div className="kpi-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* карта процесу — на всю ширину */}
      <section className="panel map-panel">
        <header className="panel-head">
          <h2>Карта процесу</h2>
          <span className="panel-sub">
            {graph.nodes.length} активностей · {graph.edges.length} переходів ·
            {' '}{rework.total} повернень
          </span>
          <div className="heat-legend">
            <span>швидко</span>
            <i className="heat-bar" />
            <span>повільно</span>
          </div>
        </header>
        <div className="map-scroll">
          <ProcessMap nodes={graph.nodes} edges={graph.edges} />
        </div>
      </section>

      <div className="ck-grid">
        {/* ліва колонка */}
        <div className="ck-left">
          <section className="panel">
            <header className="panel-head">
              <h2>Оброблено подій · накопичувально</h2>
              <span className="legend-chip"><i style={{ background: 'var(--red)' }} />Оброблено подій</span>
            </header>
            <AreaChart series={cumulative.series} start={cumulative.start} end={cumulative.end} />
          </section>

          <section className="panel">
            <header className="panel-head"><h2>Розподіл часу очікування</h2></header>
            <Histogram counts={histogram.counts} thresholdBin={histogram.thresholdBin} />
            <p className="muted small">хвіст розподілу (червоний) — аномальні затримки</p>
          </section>
        </div>

        {/* права колонка */}
        <div className="ck-right">
          <section className="panel">
            <header className="panel-head">
              <h2>Рейтинг вузьких місць</h2>
              <span className="panel-sub">за середнім часом очікування</span>
            </header>
            {bottlenecks.length === 0 && <p className="muted small">Вузьких місць не виявлено.</p>}
            <ul className="bn-rank">
              {bottlenecks.map((b, i) => (
                <li key={b.activity} className={`bn-item ${b.severity}`}>
                  <span className="bn-no" style={{ color: SEV[b.severity].color }}>{i + 1}</span>
                  <div className="bn-main">
                    <div className="bn-row">
                      <span className="bn-name">{b.activity}</span>
                      <span className="bn-val" style={{ color: SEV[b.severity].color }}>{dur(b.avgWait)}</span>
                    </div>
                    <div className="bn-row">
                      <span className="tag" style={{ background: SEV[b.severity].soft, color: SEV[b.severity].color }}>
                        {SEV[b.severity].label}
                      </span>
                      <span className="bn-z">z {b.z_score.toFixed(1)}</span>
                    </div>
                    <div className="bn-bar"><i style={{ width: pct(b.avgWait / maxWait), background: SEV[b.severity].color }} /></div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {top && (
            <section className="panel insight">
              <header className="panel-head"><h2>◆ Автоматичний висновок</h2></header>
              <p>
                Етап «<b>{top.activity}</b>» має найбільше очікування — <b>{dur(top.avgWait)}</b>,
                що у {ratio.toFixed(1).replace('.', ',')}× перевищує поріг {dur(threshold)} (μ+σ).
                Це головний кандидат на оптимізацію{rework.total ? `; також виявлено ${num(rework.total)} повернень` : ''}.
              </p>
              <div className="insight-actions">
                <button className="btn">Створити задачу</button>
                <button className="btn ghost">Експорт PDF</button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
