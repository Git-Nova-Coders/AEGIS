import React, { useState, useEffect } from 'react';
import { Wallet, ShieldCheck, CheckCircle2, Clock, ExternalLink, RefreshCw, Zap } from 'lucide-react';
import { fetchPolicies } from '../services/api';

export default function PolicyLedger({ onSelectPolicyForOracle }) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await fetchPolicies();
      setPolicies(list);
    } catch (err) {
      console.error('Error loading policies:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = policies.filter(p => {
    if (filter === 'ACTIVE') return p.status === 'ACTIVE' && !p.paid_out;
    if (filter === 'PAID_OUT') return p.paid_out;
    return true;
  });

  const totalCoverage = policies.reduce((acc, p) => acc + p.coverage_amount, 0);
  const totalSettled = policies.filter(p => p.paid_out).reduce((acc, p) => acc + p.coverage_amount, 0);
  const activeCount = policies.filter(p => p.status === 'ACTIVE' && !p.paid_out).length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Metrics Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Policies Minted</div>
          <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
            {policies.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34d399' }}>On-Chain Smart Contract Ledger</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Policies</div>
          <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8' }}>
            {activeCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting Oracle Verification</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Coverage Underwritten</div>
          <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24' }}>
            ${totalCoverage.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Capital Pool Reserve</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Autonomous Payouts Settled</div>
          <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>
            ${totalSettled.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34d399' }}>100% Verified Oracle Settlement</div>
        </div>
      </div>

      {/* Policies Table Card */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wallet size={20} color="#38bdf8" />
              On-Chain Policy Registry
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Transparent smart contract state and autonomous settlement logs
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              {['ALL', 'ACTIVE', 'PAID_OUT'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={filter === f ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                >
                  {f === 'PAID_OUT' ? 'SETTLED' : f}
                </button>
              ))}
            </div>

            <button onClick={loadData} className="btn-secondary" style={{ padding: '0.45rem' }}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Policy Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Policy ID</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Beneficiary</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Coverage</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Premium</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Trigger Criteria</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map(policy => (
                  <tr key={policy.policy_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '0.9rem 0.5rem' }}>
                      <div className="font-mono" style={{ fontWeight: 700, color: '#38bdf8' }}>{policy.policy_id}</div>
                      <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        Tx: {policy.created_tx_hash ? `${policy.created_tx_hash.slice(0, 10)}...` : '0x...'}
                      </div>
                    </td>

                    <td style={{ padding: '0.9rem 0.5rem' }}>
                      <div style={{ fontWeight: 600 }}>{policy.holder_name}</div>
                      <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {policy.wallet_address.slice(0, 8)}...{policy.wallet_address.slice(-6)}
                      </div>
                    </td>

                    <td style={{ padding: '0.9rem 0.5rem' }}>
                      <span className="font-mono" style={{ fontWeight: 700, color: '#34d399' }}>
                        ${policy.coverage_amount.toLocaleString()}
                      </span>
                    </td>

                    <td style={{ padding: '0.9rem 0.5rem' }}>
                      <span className="font-mono">${policy.premium_amount.toFixed(2)}</span>
                    </td>

                    <td style={{ padding: '0.9rem 0.5rem' }}>
                      <div style={{ fontSize: '0.75rem' }}>
                        Risk $\ge$ <span style={{ color: '#f87171', fontWeight: 600 }}>{(policy.risk_threshold * 100).toFixed(0)}%</span><br />
                        Conf $\ge$ <span style={{ color: '#38bdf8', fontWeight: 600 }}>{(policy.confidence_threshold * 100).toFixed(0)}%</span>
                      </div>
                    </td>

                    <td style={{ padding: '0.9rem 0.5rem' }}>
                      {policy.paid_out ? (
                        <div>
                          <span className="badge-very-high" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                            <CheckCircle2 size={12} /> PAID OUT
                          </span>
                          {policy.payout_tx_hash && (
                            <div className="font-mono" style={{ fontSize: '0.65rem', color: '#38bdf8', marginTop: '0.2rem' }}>
                              Tx: {policy.payout_tx_hash.slice(0, 12)}...
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="badge-low">
                          <Clock size={12} /> ACTIVE
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '0.9rem 0.5rem' }}>
                      {!policy.paid_out && (
                        <button
                          onClick={() => onSelectPolicyForOracle(policy.policy_id)}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        >
                          <Zap size={14} color="#f59e0b" />
                          Simulate Trigger
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No policies found in ledger. Mint a policy to begin!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
