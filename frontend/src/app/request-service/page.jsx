'use client';

import { useState } from 'react';
import api from '../../lib/api';

const emptyForm = {
  name: '',
  phone: '',
  city: '',
  serviceType: '',
  description: '',
};

const services = [
  { value: '1', label: 'Service 1', icon: '🔧', desc: 'General maintenance & repairs' },
  { value: '2', label: 'Service 2', icon: '⚡', desc: 'Electrical & technical work' },
  { value: '3', label: 'Service 3', icon: '🏠', desc: 'Home improvement & renovation' },
];

export default function RequestServicePage() {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.post('/leads', {
        ...form,
        serviceType: Number(form.serviceType),
      });
      setStatus({
        type: 'success',
        msg: `Request submitted! Assigned to: ${res.data.assignedProviders.join(', ')}`,
      });
      setForm(emptyForm);
    } catch (err) {
      setStatus({
        type: 'error',
        msg: err.response?.data?.error || 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .rs-root {
          min-height: calc(100vh - 56px);
          background: #f7f6f3;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 3rem 1.5rem 4rem;
          font-family: 'DM Sans', sans-serif;
        }
        .rs-shell {
          width: 100%;
          max-width: 780px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          background: #fff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 2px 40px rgba(0,0,0,0.09);
        }
        .rs-left {
          background: #1a1a2e;
          padding: 2.5rem 2rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .rs-left::before {
          content: '';
          position: absolute;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: rgba(99,91,255,0.15);
          top: -60px;
          right: -80px;
        }
        .rs-left::after {
          content: '';
          position: absolute;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
          bottom: 40px;
          left: -50px;
        }
        .rs-eyebrow {
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #635bff;
          margin-bottom: 1rem;
        }
        .rs-left h1 {
          font-family: 'Syne', sans-serif;
          font-size: 2rem;
          font-weight: 800;
          color: #fff;
          line-height: 1.15;
          margin: 0 0 1rem;
        }
        .rs-left p {
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          line-height: 1.7;
          margin: 0 0 2rem;
        }
        .rs-services {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .rs-service-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 10px 14px;
        }
        .rs-service-chip .chip-icon { font-size: 18px; line-height: 1; }
        .rs-service-chip .chip-text { flex: 1; }
        .rs-service-chip .chip-name { font-size: 13px; font-weight: 500; color: #fff; }
        .rs-service-chip .chip-desc { font-size: 11px; color: rgba(255,255,255,0.4); }
        .rs-note {
          margin-top: 2rem;
          font-size: 11px;
          color: rgba(255,255,255,0.25);
          line-height: 1.6;
        }
        .rs-right {
          padding: 2.5rem 2rem;
          display: flex;
          flex-direction: column;
        }
        .rs-form-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 1.5rem;
        }
        .rs-field { margin-bottom: 1rem; }
        .rs-label {
          display: block;
          font-size: 11.5px;
          font-weight: 500;
          color: #888;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .rs-input {
          width: 100%;
          padding: 10px 13px;
          border: 1.5px solid #e8e6f0;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #1a1a2e;
          background: #fafafa;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
          outline: none;
          -webkit-appearance: none;
        }
        .rs-input:focus {
          border-color: #635bff;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(99,91,255,0.1);
        }
        .rs-input::placeholder { color: #bbb; }
        .rs-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .rs-btn {
          margin-top: 1.25rem;
          width: 100%;
          padding: 12px;
          background: #1a1a2e;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s, transform 0.1s;
        }
        .rs-btn:hover:not(:disabled) { background: #635bff; }
        .rs-btn:active:not(:disabled) { transform: scale(0.98); }
        .rs-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .rs-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: rsSpin 0.6s linear infinite;
          flex-shrink: 0;
        }
        @keyframes rsSpin { to { transform: rotate(360deg); } }
        .rs-alert {
          margin-top: 1rem;
          padding: 11px 14px;
          border-radius: 10px;
          font-size: 13px;
          line-height: 1.5;
        }
        .rs-alert-success {
          background: #edfaf3;
          color: #1a7a4a;
          border: 1px solid #b8eecf;
        }
        .rs-alert-error {
          background: #fff1f1;
          color: #c0392b;
          border: 1px solid #fbc8c8;
        }
        @media (max-width: 620px) {
          .rs-shell { grid-template-columns: 1fr; }
          .rs-left { padding: 2rem 1.5rem; }
          .rs-left::before, .rs-left::after { display: none; }
          .rs-left h1 { font-size: 1.6rem; }
          .rs-right { padding: 1.75rem 1.5rem; }
          .rs-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="rs-root">
        <div className="rs-shell">

          {/* Left panel */}
          <div className="rs-left">
            <div>
              <p className="rs-eyebrow">Prowider</p>
              <h1>Request a service</h1>
              <p>Tell us what you need and we'll match you with the right providers in your city.</p>
              <div className="rs-services">
                {services.map((s) => (
                  <div key={s.value} className="rs-service-chip">
                    <span className="chip-icon">{s.icon}</span>
                    <div className="chip-text">
                      <div className="chip-name">{s.label}</div>
                      <div className="chip-desc">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="rs-note">
              The same phone number cannot be used for more than one request per service type.
            </p>
          </div>

          {/* Right panel */}
          <div className="rs-right">
            <p className="rs-form-title">Your details</p>

            <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="rs-field">
                <label className="rs-label">Full Name</label>
                <input
                  className="rs-input"
                  name="name"
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="rs-row">
                <div className="rs-field">
                  <label className="rs-label">Phone</label>
                  <input
                    className="rs-input"
                    name="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="rs-field">
                  <label className="rs-label">City</label>
                  <input
                    className="rs-input"
                    name="city"
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={form.city}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="rs-field">
                <label className="rs-label">Service Type</label>
                <select
                  className="rs-input"
                  name="serviceType"
                  value={form.serviceType}
                  onChange={handleChange}
                  required
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">— Select a service —</option>
                  {services.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="rs-field" style={{ flex: 1 }}>
                <label className="rs-label">Description</label>
                <textarea
                  className="rs-input"
                  name="description"
                  placeholder="Describe what you need..."
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  style={{ resize: 'none' }}
                />
              </div>

              <button type="submit" className="rs-btn" disabled={loading}>
                {loading ? (
                  <><span className="rs-spinner" /> Submitting…</>
                ) : (
                  'Submit Request →'
                )}
              </button>
            </form>

            {status && (
              <div className={`rs-alert rs-alert-${status.type === 'success' ? 'success' : 'error'}`}>
                {status.msg}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
