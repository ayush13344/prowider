'use client';

import { useState, useRef } from 'react';
import api from '../../lib/api';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune', 'Hyderabad'];

export default function TestToolsPage() {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState({
    reset: false,
    idempotency: false,
    concurrent: false,
  });
  const logRef = useRef(null);

  const addLog = (msg, type = 'ok') => {
    const time = new Date().toLocaleTimeString();
    setLog((prev) => [...prev, { time, msg, type }]);
    setTimeout(() => {
      if (logRef.current)
        logRef.current.scrollTop = logRef.current.scrollHeight;
    }, 50);
  };

  const clearLog = () => setLog([]);

  // ── Button 1: Reset quota with a fresh unique key ────────────────────────
  const handleResetQuota = async () => {
    setLoading((p) => ({ ...p, reset: true }));
    const key = generateUUID();
    addLog(`Sending quota reset with key: ${key}`, 'ok');
    try {
      const res = await api.post('/webhook/quota-reset', {
        idempotencyKey: key,
      });
      if (res.data.success) {
        addLog('✓ Quota reset successful — all providers back to 10/10', 'ok');
      } else {
        addLog(`Skipped: ${res.data.reason}`, 'skip');
      }
    } catch (err) {
      addLog(
        `Error: ${err.response?.data?.error || err.message}`,
        'error'
      );
    } finally {
      setLoading((p) => ({ ...p, reset: false }));
    }
  };

  // ── Button 2: Same key 5 times — only first should process ──────────────
  const handleIdempotencyTest = async () => {
    setLoading((p) => ({ ...p, idempotency: true }));
    const key = generateUUID();
    addLog(`--- Idempotency test: sending same key 5× ---`, 'ok');
    addLog(`Key: ${key}`, 'ok');

    for (let i = 1; i <= 5; i++) {
      try {
        const res = await api.post('/webhook/quota-reset', {
          idempotencyKey: key,
        });
        if (res.data.skipped) {
          addLog(
            `Call ${i}: SKIPPED ✓ (idempotent — key already used)`,
            'skip'
          );
        } else {
          addLog(`Call ${i}: PROCESSED ✓ (quota reset applied)`, 'ok');
        }
      } catch (err) {
        addLog(
          `Call ${i}: ERROR — ${err.response?.data?.error || err.message}`,
          'error'
        );
      }
    }

    addLog(`--- Done. Only call 1 should say PROCESSED ---`, 'ok');
    setLoading((p) => ({ ...p, idempotency: false }));
  };

  // ── Button 3: 10 concurrent leads — tests race conditions ───────────────
  const handleConcurrentLeads = async () => {
    setLoading((p) => ({ ...p, concurrent: true }));
    addLog('--- Generating 10 concurrent leads ---', 'ok');

    const timestamp = Date.now();
    const promises = Array.from({ length: 10 }, (_, i) => {
      const serviceType = (i % 3) + 1;
      const payload = {
        name: `Concurrent User ${i + 1}`,
        phone: `800${timestamp}${i}`.slice(0, 10),
        city: CITIES[i % CITIES.length],
        serviceType,
        description: `Concurrency test lead #${i + 1}`,
      };

      return api
        .post('/leads', payload)
        .then((r) => ({
          index: i + 1,
          ok: true,
          providers: r.data.assignedProviders,
          service: serviceType,
        }))
        .catch((err) => ({
          index: i + 1,
          ok: false,
          error: err.response?.data?.error || err.message,
          service: serviceType,
        }));
    });

    const results = await Promise.all(promises);

    results.forEach((r) => {
      if (r.ok) {
        addLog(
          `Lead ${r.index} (Service ${r.service}): assigned to providers [${r.providers.join(', ')}]`,
          'ok'
        );
      } else {
        addLog(
          `Lead ${r.index} (Service ${r.service}): FAILED — ${r.error}`,
          'error'
        );
      }
    });

    const ok = results.filter((r) => r.ok).length;
    addLog(
      `--- Done. ${ok}/10 created successfully. Check dashboard for updated quotas. ---`,
      'ok'
    );
    setLoading((p) => ({ ...p, concurrent: false }));
  };

  return (
    <div className="page">
      <h1>Test Tools</h1>

      <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
        This panel simulates a payment gateway webhook and tests system
        reliability. It is intentionally separate from the normal user UI.
      </div>

      {/* Webhook section */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2>Webhook — Quota Reset</h2>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            marginBottom: '1rem',
          }}
        >
          Simulates a payment gateway confirming a provider's subscription
          renewal. Quota can ONLY be reset through this webhook — not from the
          normal UI.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            onClick={handleResetQuota}
            disabled={loading.reset}
          >
            {loading.reset && <span className="spinner" />}
            Reset all quotas to 10
          </button>

          <button
            className="btn-secondary"
            onClick={handleIdempotencyTest}
            disabled={loading.idempotency}
          >
            {loading.idempotency && (
              <span
                className="spinner"
                style={{
                  borderTopColor: 'var(--primary)',
                  borderColor: 'rgba(79,70,229,0.2)',
                }}
              />
            )}
            Send same webhook key 5×
          </button>
        </div>
      </div>

      {/* Concurrency section */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2>Concurrency — 10 Simultaneous Leads</h2>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            marginBottom: '1rem',
          }}
        >
          Fires 10 lead creation requests at the exact same time using
          Promise.all. Verifies that provider quota and assignment logic holds
          under race conditions.
        </p>
        <button
          className="btn-primary"
          style={{ background: '#7c3aed' }}
          onClick={handleConcurrentLeads}
          disabled={loading.concurrent}
        >
          {loading.concurrent && <span className="spinner" />}
          Generate 10 concurrent leads
        </button>
      </div>

      {/* Log output */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.5rem',
        }}
      >
        <h2 style={{ margin: 0 }}>Output log</h2>
        <button
          className="btn-secondary"
          style={{ fontSize: 12, padding: '4px 10px' }}
          onClick={clearLog}
        >
          Clear
        </button>
      </div>

      <div className="log-box" ref={logRef}>
        {log.length === 0 ? (
          <span style={{ color: '#4b5563' }}>
            Click a button above — output will appear here...
          </span>
        ) : (
          log.map((entry, i) => (
            <div
              key={i}
              className={`log-entry ${
                entry.type === 'skip'
                  ? 'log-skip'
                  : entry.type === 'error'
                  ? 'log-error'
                  : 'log-ok'
              }`}
            >
              <span style={{ color: '#6b7280', marginRight: 8 }}>
                {entry.time}
              </span>
              {entry.msg}
            </div>
          ))
        )}
      </div>

      {/* Reference table */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2>Assignment rules reference</h2>
        <table
          style={{
            width: '100%',
            fontSize: 13,
            borderCollapse: 'collapse',
            marginTop: '0.5rem',
          }}
        >
          <thead>
            <tr style={{ background: 'var(--bg)' }}>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                Service
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                Mandatory providers
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                Fair pool (round-robin)
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                service: 'Service 1',
                mandatory: '1',
                pool: '2, 3, 4 (picks 2)',
              },
              {
                service: 'Service 2',
                mandatory: '5',
                pool: '6, 7, 8 (picks 2)',
              },
              {
                service: 'Service 3',
                mandatory: '1, 4',
                pool: '2, 3, 5, 6, 7, 8 (picks 1)',
              },
            ].map((row) => (
              <tr key={row.service}>
                <td
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {row.service}
                </td>
                <td
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--primary)',
                  }}
                >
                  {row.mandatory}
                </td>
                <td
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {row.pool}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
