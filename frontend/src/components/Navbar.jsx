import React from 'react';
import { Shield, Wallet, Activity, Cpu, ExternalLink } from 'lucide-react';

export default function Navbar({ wallet, onConnectWallet, activeTab, setActiveTab }) {
  return (
    <header className="sticky top-0 z-50 glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0 }}>
      {/* Research Disclaimer Banner */}
      <div style={{ background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.15), rgba(99, 102, 241, 0.15))', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0.35rem 1rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
        <span style={{ fontWeight: 700, color: '#38bdf8' }}>RESEARCH PROTOTYPE:</span> AI-Native Parametric Health Protocol (2024 CDC BRFSS Trained • Not for Medical Diagnosis or Financial Underwriting)
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setActiveTab('assessment')}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)' }}>
            <Shield size={24} color="#030712" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>AEGIS</span>
              <span className="badge-low" style={{ padding: '0.15rem 0.5rem', fontSize: '0.65rem' }}>PROTOCOL v1.0</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Autonomous Parametric Health Insurance</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.3rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          {[
            { id: 'assessment', label: '1. AI Risk Engine', icon: Activity },
            { id: 'pricing', label: '2. Dynamic Pricing', icon: Shield },
            { id: 'oracle', label: '3. Oracle & Payout', icon: Cpu },
            { id: 'ledger', label: 'On-Chain Ledger', icon: Wallet },
            { id: 'telemetry', label: 'Model Telemetry', icon: ExternalLink },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: isActive ? 'var(--primary-gradient)' : 'transparent',
                  color: isActive ? '#030712' : 'var(--text-muted)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Wallet Connector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', color: '#34d399' }}>
            <span className="pulse-dot" style={{ background: '#10b981' }}></span>
            <span className="font-mono">EVM SimNet / Hardhat</span>
          </div>

          <button
            onClick={onConnectWallet}
            className={wallet.connected ? 'btn-secondary' : 'btn-primary'}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <Wallet size={16} />
            {wallet.connected ? (
              <span className="font-mono">
                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)} ({wallet.balance} ETH)
              </span>
            ) : (
              'Connect Wallet'
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
