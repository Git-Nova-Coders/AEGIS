import React, { useState, useEffect } from 'react';
import { Cpu, Zap, CheckCircle2, XCircle, AlertTriangle, ArrowRight, ShieldCheck, RefreshCw, Terminal } from 'lucide-react';
import confetti from 'canvas-confetti';
import { fetchPolicies, simulateOracleTrigger } from '../services/api';

export default function OracleSimulation({ selectedPolicyId, onPayoutSettled }) {
  const [policies, setPolicies] = useState([]);
  const [activePolicyId, setActivePolicyId] = useState(selectedPolicyId || '');
  const [observedRisk, setObservedRisk] = useState(0.94);
  const [observedConfidence, setObservedConfidence] = useState(0.97);
  const [eventDescription, setEventDescription] = useState('Acute cardiovascular biomarker & clinical event telemetry');
  
  const [transmitting, setTransmitting] = useState(false);
  const [executionLog, setExecutionLog] = useState([]);
  const [lastResponse, setLastResponse] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const list = await fetchPolicies();
      setPolicies(list);
      if (list.length > 0 && !activePolicyId) {
        setActivePolicyId(list[0].policy_id);
      }
    } catch (err) {
      console.error('Error fetching policies:', err);
    }
  };

  const selectedPolicy = policies.find(p => p.policy_id === activePolicyId);

  const applyScenario = (type) => {
    if (type === 'qualifying') {
      setObservedRisk(0.94);
      setObservedConfidence(0.97);
      setEventDescription('Qualifying Acute Hospitalization & High Health-Risk Biomarker Escalation');
    } else if (type === 'subthreshold') {
      setObservedRisk(0.55);
      setObservedConfidence(0.92);
      setEventDescription('Mild ambulatory fluctuation (Sub-threshold event)');
    } else if (type === 'low_confidence') {
      setObservedRisk(0.92);
      setObservedConfidence(0.68);
      setEventDescription('High risk reading with low sensor / model confidence');
    }
  };

  const handleTransmitEvent = async () => {
    if (!activePolicyId) {
      alert('Please select an active policy to test.');
      return;
    }

    setTransmitting(true);
    setError(null);
    setLastResponse(null);

    const logs = [];
    logs.push(`[${new Date().toLocaleTimeString()}] INITIATING ORACLE VERIFICATION SEQUENCE`);
    logs.push(`[${new Date().toLocaleTimeString()}] Fetching oracle node signature from 0x89205A3A...43e7`);
    setExecutionLog([...logs]);

    try {
      await new Promise(r => setTimeout(r, 600));
      logs.push(`[${new Date().toLocaleTimeString()}] Telemetry signed. Transmitting to AegisInsurance.sol contract...`);
      setExecutionLog([...logs]);

      const res = await simulateOracleTrigger({
        policy_id: activePolicyId,
        event_type: 'HEALTH_RISK_TRIGGER',
        observed_risk_probability: observedRisk,
        observed_confidence: observedConfidence,
        event_description: eventDescription,
      });

      await new Promise(r => setTimeout(r, 800));
      logs.push(`[${new Date().toLocaleTimeString()}] Smart Contract Evaluation:`);
      logs.push(`  → Policy Active: ${selectedPolicy ? !selectedPolicy.paid_out : true}`);
      logs.push(`  → Observed Risk: ${(observedRisk * 100).toFixed(1)}% (Threshold: ${selectedPolicy ? (selectedPolicy.risk_threshold * 100).toFixed(1) : '80'}%)`);
      logs.push(`  → Observed Confidence: ${(observedConfidence * 100).toFixed(1)}% (Threshold: ${selectedPolicy ? (selectedPolicy.confidence_threshold * 100).toFixed(1) : '85'}%)`);

      if (res.payout_executed) {
        logs.push(`[${new Date().toLocaleTimeString()}] ✅ ALL CONDITIONS SATISFIED!`);
        logs.push(`[${new Date().toLocaleTimeString()}] 💰 AUTOMATIC PAYOUT RELEASED: $${selectedPolicy ? selectedPolicy.coverage_amount.toLocaleString() : '5,000'} to ${selectedPolicy ? selectedPolicy.wallet_address : 'beneficiary'}`);
        logs.push(`[${new Date().toLocaleTimeString()}] Tx Hash: ${res.payout_tx_hash}`);
        
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 }
        });

        if (onPayoutSettled) onPayoutSettled(res);
        loadPolicies(); // Refresh policy list
      } else {
        logs.push(`[${new Date().toLocaleTimeString()}] ❌ CONDITION REJECTED: ${res.settlement_message}`);
      }

      setExecutionLog([...logs]);
      setLastResponse(res);
    } catch (err) {
      setError(err.message || 'Oracle transmission failed');
      logs.push(`[${new Date().toLocaleTimeString()}] ⚠️ ERROR: ${err.message}`);
      setExecutionLog([...logs]);
    } finally {
      setTransmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
      {/* Left Column: Oracle Control Console */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={20} color="#38bdf8" />
            Parametric Oracle Simulation Console
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Inject verified external real-world health events to test autonomous smart contract settlement
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Policy Selector */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
              Target Policy on Ledger
            </label>
            {policies.length > 0 ? (
              <select
                className="select-field"
                value={activePolicyId}
                onChange={e => setActivePolicyId(e.target.value)}
              >
                {policies.map(p => (
                  <option key={p.policy_id} value={p.policy_id}>
                    {p.policy_id} — ${p.coverage_amount.toLocaleString()} Coverage ({p.status})
                  </option>
                ))}
              </select>
            ) : (
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.75rem', borderRadius: '8px', color: '#fbbf24', fontSize: '0.8rem' }}>
                No active policies found. Please mint a policy in the Dynamic Pricing tab first!
              </div>
            )}
          </div>

          {/* Selected Policy Quick Status */}
          {selectedPolicy && (
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Coverage Amount:</span>
                <div style={{ fontWeight: 700, color: '#34d399', fontSize: '1rem' }}>${selectedPolicy.coverage_amount.toLocaleString()}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <div>
                  <span className={selectedPolicy.paid_out ? 'badge-very-high' : 'badge-low'}>
                    {selectedPolicy.status}
                  </span>
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Risk Trigger Threshold:</span>
                <div style={{ fontWeight: 600, color: '#f87171' }}>{(selectedPolicy.risk_threshold * 100).toFixed(0)}%</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Confidence Threshold:</span>
                <div style={{ fontWeight: 600, color: '#38bdf8' }}>{(selectedPolicy.confidence_threshold * 100).toFixed(0)}%</div>
              </div>
            </div>
          )}

          {/* Preset Scenario Buttons */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
              Quick Simulation Test Scenarios
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => applyScenario('qualifying')}
                className="btn-secondary"
                style={{ textAlign: 'left', justifyContent: 'flex-start', borderLeft: '4px solid #ef4444' }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#f87171' }}>Scenario A: Qualifying Health Event (94% Risk, 97% Conf)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Exceeds all thresholds $\rightarrow$ Triggers instant automatic payout</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyScenario('subthreshold')}
                className="btn-secondary"
                style={{ textAlign: 'left', justifyContent: 'flex-start', borderLeft: '4px solid #f59e0b' }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#fbbf24' }}>Scenario B: Sub-Threshold Fluctuation (55% Risk)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Below risk threshold $\rightarrow$ Contract rejects payout</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyScenario('low_confidence')}
                className="btn-secondary"
                style={{ textAlign: 'left', justifyContent: 'flex-start', borderLeft: '4px solid #38bdf8' }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#38bdf8' }}>Scenario C: Low Confidence Sensor (68% Conf)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Below confidence threshold $\rightarrow$ Circuit breaker holds payout</div>
                </div>
              </button>
            </div>
          </div>

          {/* Custom Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                <span>Observed Health Risk Probability:</span>
                <span className="font-mono" style={{ fontWeight: 700, color: '#f87171' }}>
                  {(observedRisk * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.99"
                step="0.01"
                value={observedRisk}
                onChange={e => setObservedRisk(parseFloat(e.target.value))}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                <span>Observed Oracle Confidence:</span>
                <span className="font-mono" style={{ fontWeight: 700, color: '#38bdf8' }}>
                  {(observedConfidence * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.99"
                step="0.01"
                value={observedConfidence}
                onChange={e => setObservedConfidence(parseFloat(e.target.value))}
              />
            </div>
          </div>

          <button
            onClick={handleTransmitEvent}
            disabled={transmitting || !activePolicyId || (selectedPolicy && selectedPolicy.paid_out)}
            className="btn-primary"
            style={{ width: '100%', padding: '0.85rem' }}
          >
            {transmitting ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Validating & Settling On-Chain...
              </>
            ) : selectedPolicy && selectedPolicy.paid_out ? (
              'Policy Already Settled (Paid Out)'
            ) : (
              <>
                <Zap size={18} />
                Transmit Event to Smart Contract
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Column: Live Autonomous Execution Terminal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.75rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={18} color="#38bdf8" />
              Smart Contract Execution Logs
            </h3>
            <span className="font-mono" style={{ fontSize: '0.75rem', color: '#34d399' }}>● AUTONOMOUS SETTLEMENT</span>
          </div>

          {/* Terminal Console Window */}
          <div style={{ background: '#020617', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.25rem', flex: 1, minHeight: '320px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#38bdf8', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {executionLog.length > 0 ? (
              executionLog.map((line, idx) => (
                <div key={idx} style={{ color: line.includes('✅') ? '#34d399' : line.includes('❌') ? '#f87171' : line.includes('💰') ? '#fbbf24' : '#94a3b8' }}>
                  {line}
                </div>
              ))
            ) : (
              <div style={{ color: '#475569', fontStyle: 'italic', margin: 'auto', textAlign: 'center' }}>
                // Oracle execution terminal idle.<br />
                // Select a scenario and click "Transmit Event".
              </div>
            )}
          </div>

          {/* Result Card Highlight */}
          {lastResponse && (
            <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: '12px', background: lastResponse.payout_executed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: lastResponse.payout_executed ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: lastResponse.payout_executed ? '#34d399' : '#f87171' }}>
                {lastResponse.payout_executed ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                <span>{lastResponse.payout_executed ? 'AUTOMATIC PAYOUT EXECUTED' : 'PAYOUT CONDITIONS NOT MET'}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#f8fafc', marginTop: '0.35rem' }}>
                {lastResponse.settlement_message}
              </p>
              {lastResponse.payout_tx_hash && (
                <div className="font-mono" style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.5rem' }}>
                  Tx Hash: {lastResponse.payout_tx_hash}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
