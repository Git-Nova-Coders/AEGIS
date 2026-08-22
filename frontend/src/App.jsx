import React, { useState } from 'react';
import Navbar from './components/Navbar';
import RiskAssessment from './components/RiskAssessment';
import PremiumQuote from './components/PremiumQuote';
import OracleSimulation from './components/OracleSimulation';
import PolicyLedger from './components/PolicyLedger';
import ModelTelemetry from './components/ModelTelemetry';
import WalletModal from './components/WalletModal';
import { Shield, Activity, Cpu, Wallet, ArrowRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('assessment');
  const [wallet, setWallet] = useState({
    connected: true,
    address: '0x71C83a9eB85124Bf9116e2518a221f414F5e3a9B',
    balance: '2.50',
  });
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [riskResult, setRiskResult] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [targetPolicyId, setTargetPolicyId] = useState('');

  const handleRiskAssessed = (result, profile) => {
    setRiskResult(result);
    setCurrentProfile(profile);
  };

  const handlePolicyCreated = (policy) => {
    setTargetPolicyId(policy.policy_id);
  };

  const handleSelectPolicyForOracle = (policyId) => {
    setTargetPolicyId(policyId);
    setActiveTab('oracle');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        wallet={wallet}
        onConnectWallet={() => setIsWalletModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main style={{ flex: 1, padding: '1.5rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        {/* Step Progression Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {[
            { id: 'assessment', num: '1', title: 'AI Risk Engine' },
            { id: 'pricing', num: '2', title: 'Dynamic Pricing' },
            { id: 'oracle', num: '3', title: 'Oracle & Automatic Payout' },
          ].map((step, idx) => (
            <React.Fragment key={step.id}>
              <div
                onClick={() => setActiveTab(step.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '9999px',
                  background: activeTab === step.id ? 'var(--primary-gradient)' : 'rgba(15, 23, 42, 0.6)',
                  color: activeTab === step.id ? '#030712' : 'var(--text-muted)',
                  fontWeight: activeTab === step.id ? 700 : 500,
                  fontSize: '0.8rem',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: activeTab === step.id ? '#030712' : '#334155', color: activeTab === step.id ? '#38bdf8' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
                  {step.num}
                </span>
                <span>{step.title}</span>
              </div>
              {idx < 2 && <ArrowRight size={14} color="#475569" />}
            </React.Fragment>
          ))}
        </div>

        {/* Tab Views */}
        {activeTab === 'assessment' && (
          <RiskAssessment
            onRiskAssessed={handleRiskAssessed}
            riskResult={riskResult}
            setRiskResult={setRiskResult}
            onProceedToPricing={() => setActiveTab('pricing')}
          />
        )}

        {activeTab === 'pricing' && (
          <PremiumQuote
            riskResult={riskResult}
            wallet={wallet}
            onPolicyCreated={handlePolicyCreated}
            onProceedToOracle={() => setActiveTab('oracle')}
          />
        )}

        {activeTab === 'oracle' && (
          <OracleSimulation
            selectedPolicyId={targetPolicyId}
            onPayoutSettled={() => {}}
          />
        )}

        {activeTab === 'ledger' && (
          <PolicyLedger
            onSelectPolicyForOracle={handleSelectPolicyForOracle}
          />
        )}

        {activeTab === 'telemetry' && (
          <ModelTelemetry />
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '1.5rem', background: 'rgba(7, 10, 18, 0.9)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <strong style={{ color: 'var(--text-muted)' }}>AEGIS</strong> — AI-Native Autonomous Parametric Health Insurance Protocol
          </div>
          <div className="font-mono">
            Model: LightGBM-Calibrated-Sigmoid (Brier: 0.1004 • ROC-AUC: 0.7952)
          </div>
          <div>
            Built with FastAPI, Solidity & React
          </div>
        </div>
      </footer>

      {/* Wallet Selection Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSelectAccount={(acc) => {
          setWallet({
            connected: true,
            address: acc.address,
            balance: acc.balance,
          });
        }}
        currentAddress={wallet.address}
      />
    </div>
  );
}
