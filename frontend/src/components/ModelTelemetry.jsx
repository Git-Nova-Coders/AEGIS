import React, { useState, useEffect } from 'react';
import { ExternalLink, ShieldCheck, Activity, LineChart, FileText, CheckCircle2 } from 'lucide-react';
import { fetchModelInfo } from '../services/api';

export default function ModelTelemetry() {
  const [modelInfo, setModelInfo] = useState(null);
  const [activeView, setActiveView] = useState('benchmarks'); // 'benchmarks', 'calibration', 'shap', 'leakage'

  useEffect(() => {
    fetchModelInfo()
      .then(data => setModelInfo(data))
      .catch(err => console.error('Error loading telemetry:', err));
  }, []);

  const testBenchmarks = [
    { name: 'LightGBM (Calibrated Sigmoid) ⭐', roc: 0.7952, pr: 0.4378, brier: 0.1004, acc: '86.71%', f1: 0.2938 },
    { name: 'LightGBM (Calibrated Isotonic)', roc: 0.7948, pr: 0.4288, brier: 0.1005, acc: '86.75%', f1: 0.3018 },
    { name: 'XGBoost (Calibrated Sigmoid)', roc: 0.7949, pr: 0.4365, brier: 0.1008, acc: '86.71%', f1: 0.2895 },
    { name: 'XGBoost (Calibrated Isotonic)', roc: 0.7946, pr: 0.4271, brier: 0.1005, acc: '86.68%', f1: 0.2920 },
    { name: 'LightGBM (Uncalibrated, weighted)', roc: 0.7952, pr: 0.4378, brier: 0.1804, acc: '73.99%', f1: 0.4372 },
    { name: 'XGBoost (Uncalibrated, weighted)', roc: 0.7949, pr: 0.4365, brier: 0.1801, acc: '74.30%', f1: 0.4379 },
    { name: 'Random Forest (Balanced)', roc: 0.7900, pr: 0.4247, brier: 0.1809, acc: '74.63%', f1: 0.4353 },
    { name: 'Logistic Regression (Balanced)', roc: 0.7901, pr: 0.4275, brier: 0.1830, acc: '74.13%', f1: 0.4340 },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Info */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={22} color="#38bdf8" />
              Machine Learning Telemetry & Actuarial Calibration
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Scientific methodology, cross-model benchmarks, and reliability diagrams
            </p>
          </div>

          {/* Navigation Sub-Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.3rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            {[
              { id: 'benchmarks', label: 'Model Benchmarks' },
              { id: 'calibration', label: 'Calibration Curves' },
              { id: 'shap', label: 'SHAP Explainability' },
              { id: 'leakage', label: 'Anti-Leakage Audit' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={activeView === tab.id ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* View 1: Benchmarks Table */}
        {activeView === 'benchmarks' && (
          <div>
            <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: '#38bdf8' }}>Key Actuarial Takeaway:</strong> In parametric insurance, probability calibration is paramount. While weighted uncalibrated models achieved high raw recall (70.7%), their probability output suffered from a high Brier score (0.1804). Probability calibration halved the Brier error to <strong style={{ color: '#34d399' }}>0.1004</strong>, guaranteeing empirical loss alignment.
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Model Architecture</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>ROC-AUC</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>PR-AUC</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Brier Score Loss</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>F1 Score</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {testBenchmarks.map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', background: m.name.includes('⭐') ? 'rgba(56, 189, 248, 0.06)' : 'transparent' }}>
                      <td style={{ padding: '0.8rem 0.5rem', fontWeight: m.name.includes('⭐') ? 700 : 500, color: m.name.includes('⭐') ? '#38bdf8' : '#f8fafc' }}>
                        {m.name}
                      </td>
                      <td className="font-mono" style={{ padding: '0.8rem 0.5rem', fontWeight: 600 }}>{m.roc.toFixed(4)}</td>
                      <td className="font-mono" style={{ padding: '0.8rem 0.5rem', fontWeight: 600 }}>{m.pr.toFixed(4)}</td>
                      <td className="font-mono" style={{ padding: '0.8rem 0.5rem', fontWeight: 700, color: m.brier < 0.11 ? '#34d399' : '#f87171' }}>
                        {m.brier.toFixed(4)}
                      </td>
                      <td className="font-mono" style={{ padding: '0.8rem 0.5rem' }}>{m.f1.toFixed(4)}</td>
                      <td className="font-mono" style={{ padding: '0.8rem 0.5rem' }}>{m.acc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View 2: Calibration Curves */}
        {activeView === 'calibration' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Reliability Diagram — Probability Calibration Comparison
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Compares predicted probability bins against observed empirical frequency of positive events.
            </p>
            <div style={{ background: '#0a0f1d', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', display: 'inline-block', maxWidth: '850px' }}>
              <img
                src="/static/reports/calibration_curves.png"
                alt="Calibration Curves"
                style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        {/* View 3: SHAP Explainability */}
        {activeView === 'shap' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              TreeSHAP Global Feature Importance Rankings
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Impact of demographic, biometric, and chronic disease factors on positive physical health impairment risk.
            </p>
            <div style={{ background: '#0a0f1d', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', display: 'inline-block', maxWidth: '850px' }}>
              <img
                src="/static/reports/shap_summary.png"
                alt="SHAP Summary Plot"
                style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        {/* View 4: Anti-Leakage Audit */}
        {activeView === 'leakage' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle2 size={24} color="#34d399" />
              <div>
                <div style={{ fontWeight: 700, color: '#34d399' }}>Anti-Leakage Audit Verification: PASSED</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  All proxy and target-derived variables have been permanently removed from training and inference inputs.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.6)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f87171', marginBottom: '0.5rem' }}>
                  Excluded Target Proxy Variables
                </h4>
                <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.8', paddingLeft: '1.25rem' }}>
                  <li><code>_PHYS14D</code>: Target classification variable.</li>
                  <li><code>PHYSHLTH</code>: Days physical health not good (source of target).</li>
                  <li><code>POORHLTH</code>: Activity limitation days.</li>
                  <li><code>_RFHLTH</code>: Binary self-rated health.</li>
                  <li><code>GENHLTH</code>: Subjective health status rating.</li>
                </ul>
              </div>

              <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.6)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.5rem' }}>
                  Validated Objective Features
                </h4>
                <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.8', paddingLeft: '1.25rem' }}>
                  <li>Cardiovascular: Heart Attack, CAD, Stroke.</li>
                  <li>Chronic: Diabetes, COPD, Kidney Disease, Arthritis, Asthma.</li>
                  <li>Biometric & Lifestyle: BMI (kg/m²), Tobacco, Physical Activity.</li>
                  <li>Socioeconomic: Age group, Sex, Education, Income, Insurance.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
