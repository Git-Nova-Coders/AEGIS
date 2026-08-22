import React, { useState, useEffect } from 'react';
import { Shield, DollarSign, Calculator, Lock, CheckCircle, ChevronRight, Zap, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { calculatePremium, createPolicy } from '../services/api';

export default function PremiumQuote({ riskResult, wallet, onPolicyCreated, onProceedToOracle }) {
  const [coverageAmount, setCoverageAmount] = useState(5000);
  const [durationMonths, setDurationMonths] = useState(12);
  const [riskThreshold, setRiskThreshold] = useState(0.80);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.88);
  const [holderName, setHolderName] = useState('Anshu (Policyholder)');
  
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [createdPolicy, setCreatedPolicy] = useState(null);
  const [error, setError] = useState(null);

  const riskProb = riskResult ? riskResult.risk_probability : 0.25;
  const riskCategory = riskResult ? riskResult.risk_category : 'LOW';

  // Automatically recalculate premium whenever coverage, duration, or risk probability changes
  useEffect(() => {
    async function fetchQuote() {
      setLoading(true);
      try {
        const data = await calculatePremium({
          risk_probability: riskProb,
          coverage_amount: coverageAmount,
          duration_months: durationMonths,
          risk_category: riskCategory,
        });
        setBreakdown(data);
      } catch (err) {
        console.error('Error fetching quote:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchQuote();
  }, [riskProb, coverageAmount, durationMonths, riskCategory]);

  const handleMintPolicy = async () => {
    if (!wallet.connected) {
      alert('Please connect your Web3 wallet before creating an on-chain policy.');
      return;
    }

    setMinting(true);
    setError(null);
    try {
      const payload = {
        wallet_address: wallet.address,
        holder_name: holderName,
        coverage_amount: coverageAmount,
        premium_amount: breakdown ? breakdown.total_premium : 350.0,
        duration_months: durationMonths,
        risk_probability: riskProb,
        risk_threshold: riskThreshold,
        confidence_threshold: confidenceThreshold,
      };

      const result = await createPolicy(payload);
      setCreatedPolicy(result);
      if (onPolicyCreated) onPolicyCreated(result);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      setError(err.message || 'Failed to mint policy on-chain');
    } finally {
      setMinting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
      {/* Left Column: Parametric Policy Configuration */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator size={20} color="#38bdf8" />
            Dynamic Actuarial Policy Configurator
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Calculates expected-loss pricing and parameterizes smart contract trigger conditions
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Baseline Risk Profile Banner */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current AI Risk Input</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8' }}>
                {(riskProb * 100).toFixed(1)}% Risk Probability
              </div>
            </div>
            <span className={`badge-${riskCategory.toLowerCase().replace('_', '-')}`}>
              {riskCategory}
            </span>
          </div>

          {/* Coverage Amount Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', alignItems: 'center' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Coverage Payout Amount</label>
              <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>
                ${coverageAmount.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="50000"
              step="500"
              value={coverageAmount}
              onChange={e => setCoverageAmount(parseFloat(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
              <span>$1,000</span>
              <span>$25,000</span>
              <span>$50,000</span>
            </div>
          </div>

          {/* Policy Duration */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', alignItems: 'center' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Policy Duration (Months)</label>
              <span className="font-mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>
                {durationMonths} Months ({durationMonths >= 12 ? `${(durationMonths / 12).toFixed(1)} Yrs` : `${durationMonths} Mo`})
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {[1, 3, 6, 12, 24].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDurationMonths(m)}
                  className={durationMonths === m ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '0.45rem', fontSize: '0.8rem' }}
                >
                  {m}M
                </button>
              ))}
            </div>
          </div>

          {/* Smart Contract Parametric Threshold Configuration */}
          <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '1rem', borderRadius: '12px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={16} />
              On-Chain Parametric Trigger Rules
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span>Payout Risk Threshold:</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#f87171' }}>
                    {(riskThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.50"
                  max="0.95"
                  step="0.01"
                  value={riskThreshold}
                  onChange={e => setRiskThreshold(parseFloat(e.target.value))}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span>Oracle Confidence Threshold:</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#38bdf8' }}>
                    {(confidenceThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.70"
                  max="0.99"
                  step="0.01"
                  value={confidenceThreshold}
                  onChange={e => setConfidenceThreshold(parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
              Policyholder Name / Alias
            </label>
            <input
              type="text"
              className="input-field"
              value={holderName}
              onChange={e => setHolderName(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Right Column: Pricing Breakdown & On-Chain Minting Card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Actuarial Pricing Breakdown</h3>
              {loading && <RefreshCw size={16} className="animate-spin" color="#38bdf8" />}
            </div>

            {breakdown ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Total Premium Display */}
                <div style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(99, 102, 241, 0.12))', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.3)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Calculated Total Policy Premium</div>
                  <div className="font-mono text-gradient" style={{ fontSize: '2.75rem', fontWeight: 800, margin: '0.25rem 0' }}>
                    ${breakdown.total_premium.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    or <strong style={{ color: '#f8fafc' }}>${breakdown.monthly_installment.toFixed(2)}</strong> / month ({durationMonths} installments)
                  </div>
                </div>

                {/* Mathematical Component Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>1. Pure Expected Loss (P × Cov)</span>
                    <span className="font-mono" style={{ fontWeight: 600 }}>${breakdown.expected_loss.toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>2. Variance Risk Loading (λ = 0.12)</span>
                    <span className="font-mono" style={{ fontWeight: 600, color: '#fbbf24' }}>+${breakdown.risk_loading.toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>3. Protocol & Underwriting (μ = 0.035)</span>
                    <span className="font-mono" style={{ fontWeight: 600, color: '#38bdf8' }}>+${breakdown.operational_margin.toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontWeight: 700 }}>
                    <span>Annualized Base Premium</span>
                    <span className="font-mono" style={{ color: '#34d399' }}>${breakdown.base_annual_premium.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Calculating dynamic actuarial quote...</div>
            )}
          </div>

          {/* Action / Minting Feedback */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.75rem', borderRadius: '8px', color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            {createdPolicy ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 700 }}>
                  <CheckCircle size={20} />
                  <span>Policy Minted On-Chain Successfully!</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Policy ID: <strong style={{ color: '#ffffff' }}>{createdPolicy.policy_id}</strong><br />
                  Tx Hash: <span className="font-mono" style={{ color: '#38bdf8' }}>{createdPolicy.created_tx_hash.slice(0, 18)}...</span>
                </div>
                <button
                  onClick={onProceedToOracle}
                  className="btn-primary"
                  style={{ width: '100%', padding: '0.6rem' }}
                >
                  Simulate Real-World Health Oracle Trigger
                  <ChevronRight size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleMintPolicy}
                disabled={minting || loading}
                className="btn-primary"
                style={{ width: '100%', padding: '0.85rem' }}
              >
                {minting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Broadcasting Transaction to Smart Contract...
                  </>
                ) : (
                  <>
                    <Shield size={18} />
                    Create & Mint Policy On-Chain (${breakdown ? breakdown.total_premium.toFixed(2) : '350.00'})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
