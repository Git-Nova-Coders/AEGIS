import React, { useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, ChevronRight, Sparkles, Heart, Zap, User, RefreshCw } from 'lucide-react';
import { predictHealthRisk } from '../services/api';

const PRESETS = {
  healthy: {
    label: 'Healthy Young Adult',
    data: {
      age_group: '25-34',
      sex: 'Female',
      bmi: 22.4,
      smoking_status: 'Never smoked',
      diabetes: 0,
      heart_disease: 0,
      stroke: 0,
      asthma: 0,
      copd: 0,
      kidney_disease: 0,
      arthritis: 0,
      physical_activity: 1,
      education_level: 'College Graduate (4+ yrs)',
      income_level: '$75k - $100k',
      insurance_type: 'Employer / Union',
      personal_doctor: 'Yes, only one',
      medical_cost_barrier: 0,
    }
  },
  moderate: {
    label: 'Middle-Aged with Moderate Risk',
    data: {
      age_group: '45-54',
      sex: 'Male',
      bmi: 29.8,
      smoking_status: 'Former smoker',
      diabetes: 0,
      heart_disease: 0,
      stroke: 0,
      asthma: 1,
      copd: 0,
      kidney_disease: 0,
      arthritis: 1,
      physical_activity: 1,
      education_level: 'Some College / Tech School',
      income_level: '$50k - $75k',
      insurance_type: 'Private / Self-purchased',
      personal_doctor: 'Yes, only one',
      medical_cost_barrier: 0,
    }
  },
  high_risk: {
    label: 'Senior with Cardiac Comorbidities',
    data: {
      age_group: '55-64',
      sex: 'Male',
      bmi: 34.2,
      smoking_status: 'Current smoker (every day)',
      diabetes: 1,
      heart_disease: 1,
      stroke: 0,
      asthma: 0,
      copd: 1,
      kidney_disease: 1,
      arthritis: 1,
      physical_activity: 0,
      education_level: 'High School Graduate / GED',
      income_level: '$25k - $35k',
      insurance_type: 'Medicare',
      personal_doctor: 'No personal doctor',
      medical_cost_barrier: 1,
    }
  }
};

export default function RiskAssessment({ onRiskAssessed, riskResult, setRiskResult, onProceedToPricing }) {
  const [profile, setProfile] = useState(PRESETS.healthy.data);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handlePresetSelect = (key) => {
    setProfile(PRESETS[key].data);
  };

  const getBmiCategory = (bmi) => {
    if (bmi < 18.5) return { label: 'Underweight', color: '#38bdf8' };
    if (bmi < 25.0) return { label: 'Normal Weight', color: '#10b981' };
    if (bmi < 30.0) return { label: 'Overweight', color: '#f59e0b' };
    return { label: 'Obese', color: '#ef4444' };
  };

  const bmiCat = getBmiCategory(profile.bmi);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await predictHealthRisk(profile);
      setRiskResult(result);
      if (onRiskAssessed) onRiskAssessed(result, profile);
    } catch (err) {
      setError(err.message || 'Error communicating with AI Risk Engine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Left Column: Health Profile Form */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} color="#38bdf8" />
              Applicant Health Profiler
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              CDC BRFSS 2024 standardized health & demographic inputs
            </p>
          </div>

          {/* Presets */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {Object.keys(PRESETS).map(key => (
              <button
                key={key}
                type="button"
                onClick={() => handlePresetSelect(key)}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
              >
                {PRESETS[key].label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Demographics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                Age Category (_AGE_G)
              </label>
              <select
                className="select-field"
                value={profile.age_group}
                onChange={e => handleInputChange('age_group', e.target.value)}
              >
                <option value="18-24">18 to 24</option>
                <option value="25-34">25 to 34</option>
                <option value="35-44">35 to 44</option>
                <option value="45-54">45 to 54</option>
                <option value="55-64">55 to 64</option>
                <option value="65+">65 or older</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                Sex (SEXVAR)
              </label>
              <select
                className="select-field"
                value={profile.sex}
                onChange={e => handleInputChange('sex', e.target.value)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          {/* BMI Range Slider */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Body Mass Index (BMI: {profile.bmi.toFixed(1)} kg/m²)
              </label>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: bmiCat.color, background: `${bmiCat.color}20`, padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                {bmiCat.label}
              </span>
            </div>
            <input
              type="range"
              min="15.0"
              max="50.0"
              step="0.1"
              value={profile.bmi}
              onChange={e => handleInputChange('bmi', parseFloat(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
              <span>15.0 (Under)</span>
              <span>22.5 (Optimal)</span>
              <span>30.0 (Obese)</span>
              <span>50.0</span>
            </div>
          </div>

          {/* Smoking & Physical Activity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                Smoking Status (_SMOKER3)
              </label>
              <select
                className="select-field"
                value={profile.smoking_status}
                onChange={e => handleInputChange('smoking_status', e.target.value)}
              >
                <option value="Never smoked">Never smoked</option>
                <option value="Former smoker">Former smoker</option>
                <option value="Current smoker (some days)">Current smoker (some days)</option>
                <option value="Current smoker (every day)">Current smoker (every day)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                Exercise in 30d (EXERANY2)
              </label>
              <select
                className="select-field"
                value={profile.physical_activity}
                onChange={e => handleInputChange('physical_activity', parseInt(e.target.value))}
              >
                <option value={1}>Yes (Active)</option>
                <option value={0}>No (Sedentary)</option>
              </select>
            </div>
          </div>

          {/* Chronic Medical Conditions (Multi-Checkbox Grid) */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.6rem', display: 'block', color: 'var(--text-main)' }}>
              Diagnosed Chronic Health Conditions
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
              {[
                { key: 'heart_disease', label: 'Heart Disease / CAD', icon: Heart },
                { key: 'diabetes', label: 'Diabetes', icon: Activity },
                { key: 'stroke', label: 'Stroke History', icon: AlertCircle },
                { key: 'copd', label: 'COPD / Emphysema', icon: Zap },
                { key: 'kidney_disease', label: 'Kidney Disease', icon: Activity },
                { key: 'arthritis', label: 'Arthritis / Gout', icon: Activity },
                { key: 'asthma', label: 'Asthma', icon: Activity },
                { key: 'medical_cost_barrier', label: 'Cost Barrier to Care', icon: AlertCircle },
              ].map(item => {
                const checked = profile[item.key] === 1;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleInputChange(item.key, checked ? 0 : 1)}
                    style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      background: checked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                      border: checked ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
                      color: checked ? '#fca5a5' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: checked ? 600 : 400,
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: checked ? '#ef4444' : '#334155' }} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.75rem', borderRadius: '8px', color: '#f87171', fontSize: '0.8rem' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Evaluating Calibrated Risk Model...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Predict Health Risk (AEGIS AI)
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Column: AI Risk Engine Output Display */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.75rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>AI Risk Evaluation Output</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calibrated LightGBM Machine Learning Model</span>
              </div>
              {riskResult && (
                <span className={`badge-${riskResult.risk_category.toLowerCase().replace('_', '-')}`}>
                  {riskResult.risk_category} RISK
                </span>
              )}
            </div>

            {riskResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Radial Gauge Simulation */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(15, 23, 42, 0.6)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Predicted Risk Probability</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: riskResult.risk_probability > 0.45 ? '#f87171' : riskResult.risk_probability > 0.20 ? '#fbbf24' : '#34d399', letterSpacing: '-0.03em' }}>
                      {(riskResult.risk_probability * 100).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Calibrated 14+ day impairment risk</div>
                  </div>

                  <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Model Confidence</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '-0.03em' }}>
                      {(riskResult.confidence * 100).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Actuarially bounded reliability</div>
                  </div>
                </div>

                {/* Contributing Factors (SHAP Insights) */}
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.6rem' }}>
                    Identified SHAP Risk Contributors
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {riskResult.contributing_factors && riskResult.contributing_factors.length > 0 ? (
                      riskResult.contributing_factors.map((factor, idx) => {
                        const isProtective = factor.startsWith('-');
                        return (
                          <div
                            key={idx}
                            style={{
                              padding: '0.5rem 0.75rem',
                              borderRadius: '8px',
                              background: isProtective ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              border: isProtective ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                              color: isProtective ? '#34d399' : '#f87171',
                              fontSize: '0.8rem',
                              fontWeight: 500,
                            }}
                          >
                            {factor}
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No elevated risk factors detected in baseline profile.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
                <Activity size={48} color="#334155" style={{ margin: '0 auto 1rem' }} />
                <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>No risk assessment evaluated yet.</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                  Adjust parameters on the left and click "Predict Health Risk".
                </p>
              </div>
            )}
          </div>

          {riskResult && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={onProceedToPricing}
                className="btn-primary"
                style={{ width: '100%' }}
              >
                Proceed to Dynamic Pricing Quote
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
