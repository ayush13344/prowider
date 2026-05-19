'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';

const SERVICE_COLORS = {
  1: '#4f46e5',
  2: '#0891b2',
  3: '#7c3aed',
};

function QuotaBadge({ remaining, total }) {
  const pct = remaining / total;
  const cls =
    pct > 0.5 ? 'badge-green' : pct > 0.2 ? 'badge-yellow' : 'badge-red';
  return (
    <span className={`badge ${cls}`}>
      {remaining}/{total} left
    </span>
  );
}

function ProviderCard({ provider }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="card"
      style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ margin: 0 }}>{provider.name}</h2>
        <QuotaBadge
          remaining={provider.remainingQuota}
          total={provider.monthlyQuota}
        />
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        Leads received:{' '}
        <strong style={{ color: 'var(--text)' }}>{provider.leadsCount}</strong>
      </div>

      {provider.leadsCount > 0 && (
        <>
          <button
            className="btn-secondary"
            style={{ fontSize: 12, padding: '5px 10px', marginTop: 4 }}
            onClick={() => setExpanded((p) => !p)}
          >
            {expanded
              ? '▲ Hide leads'
              : `▼ Show ${provider.leadsCount} lead${
                  provider.leadsCount !== 1 ? 's' : ''
                }`}
          </button>

          {expanded && (
            <ul
              style={{
                listStyle: 'none',
                marginTop: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {provider.leads.map((lead) => (
                <li
                  key={lead._id}
                  style={{
                    fontSize: 12,
                    padding: '8px 10px',
                    background: 'var(--bg)',
                    borderRadius: 6,
                    borderLeft: `3px solid ${
                      SERVICE_COLORS[lead.serviceType] || '#999'
                    }`,
                  }}
                >
                  <strong>{lead.name}</strong> · {lead.city}
                  <br />
                  <span style={{ color: 'var(--text-muted)' }}>
                    Service {lead.serviceType} · {lead.phone}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sseStatus, setSseStatus] = useState('connecting'); // connecting | live | error

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/dashboard');
      setProviders(res.data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();

    // SSE: real-time updates
    // Build the correct SSE URL — in prod NEXT_PUBLIC_API_URL may be an absolute URL
    const apiBase = process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/api`
      : '/api';
    const sseUrl = `${apiBase}/sse`;
    const es = new EventSource(sseUrl);

    es.onopen = () => setSseStatus('live');

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_LEAD' || data.type === 'QUOTA_RESET') {
          fetchDashboard();
        }
      } catch {
        // ping or non-JSON — ignore
      }
    };

    es.onerror = () => setSseStatus('error');

    return () => es.close();
  }, [fetchDashboard]);

  const totalLeads = providers.reduce((s, p) => s + p.leadsCount, 0);
  const totalQuotaUsed = providers.reduce((s, p) => s + p.usedQuota, 0);

  return (
    <div className="page">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <h1 style={{ margin: 0 }}>Provider Dashboard</h1>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            fontSize: 13,
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>
            {lastUpdated ? `Updated ${lastUpdated}` : ''}
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              color:
                sseStatus === 'live'
                  ? 'var(--success)'
                  : sseStatus === 'error'
                  ? 'var(--danger)'
                  : 'var(--warning)',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background:
                  sseStatus === 'live'
                    ? 'var(--success)'
                    : sseStatus === 'error'
                    ? 'var(--danger)'
                    : 'var(--warning)',
                display: 'inline-block',
              }}
            />
            {sseStatus === 'live'
              ? 'Live'
              : sseStatus === 'error'
              ? 'Disconnected'
              : 'Connecting'}
          </span>
          <button
            className="btn-secondary"
            style={{ fontSize: 12, padding: '5px 10px' }}
            onClick={fetchDashboard}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div
        className="card"
        style={{
          display: 'flex',
          gap: '2rem',
          marginBottom: '1.5rem',
          padding: '1rem 1.5rem',
          fontSize: 14,
        }}
      >
        <div>
          Total leads assigned: <strong>{totalLeads}</strong>
        </div>
        <div>
          Total quota used:{' '}
          <strong>
            {totalQuotaUsed} / {providers.length * 10}
          </strong>
        </div>
        <div>
          Active providers:{' '}
          <strong>{providers.filter((p) => p.leadsCount > 0).length}</strong>
        </div>
      </div>

      {loading ? (
        <p
          style={{
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: '3rem',
          }}
        >
          Loading providers...
        </p>
      ) : (
        <div className="grid-providers">
          {providers.map((p) => (
            <ProviderCard key={p.providerId} provider={p} />
          ))}
        </div>
      )}
    </div>
  );
}
