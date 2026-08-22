import React from 'react';
import { X, Wallet, Shield, CheckCircle2 } from 'lucide-react';

export default function WalletModal({ isOpen, onClose, onSelectAccount, currentAddress }) {
  if (!isOpen) return null;

  const mockAccounts = [
    { name: 'Research Sim Account #1 (Primary)', address: '0x71C83a9eB85124Bf9116e2518a221f414F5e3a9B', balance: '2.50' },
    { name: 'Research Sim Account #2 (Secondary)', address: '0x38bdf8E92B1647413009772bA5C0D3088C526A4D', balance: '10.00' },
    { name: 'Parametric Liquidity Pool Operator', address: '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7', balance: '50.00' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(10px)' }}>
      <div className="glass-panel" style={{ width: '90%', maxWidth: '480px', padding: '1.75rem', background: '#0a0f1d' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wallet size={20} color="#38bdf8" />
            Connect Web3 Wallet
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Select an EVM-compatible research account or browser wallet to sign policy minting and receive autonomous parametric payouts:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {mockAccounts.map(acc => {
            const isSelected = currentAddress === acc.address;
            return (
              <button
                key={acc.address}
                onClick={() => {
                  onSelectAccount(acc);
                  onClose();
                }}
                className="btn-secondary"
                style={{
                  padding: '0.85rem 1rem',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  borderColor: isSelected ? '#38bdf8' : 'var(--border-subtle)',
                  background: isSelected ? 'rgba(56, 189, 248, 0.1)' : 'rgba(15, 23, 42, 0.6)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: isSelected ? '#38bdf8' : '#ffffff', fontSize: '0.85rem' }}>{acc.name}</div>
                  <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    {acc.address.slice(0, 10)}...{acc.address.slice(-8)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="font-mono" style={{ fontWeight: 700, color: '#34d399', fontSize: '0.85rem' }}>{acc.balance} ETH</div>
                  {isSelected && <span style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 700 }}>CONNECTED</span>}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          Supports MetaMask, Anvil, Hardhat, and Sepolia Testnets.
        </div>
      </div>
    </div>
  );
}
