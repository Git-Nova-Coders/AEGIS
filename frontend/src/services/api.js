/**
 * AEGIS Frontend API Client
 * Interfaces with the FastAPI backend endpoints.
 */

const API_BASE_URL = '';

export async function predictHealthRisk(profile) {
  const response = await fetch(`${API_BASE_URL}/api/predict-risk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to predict health risk');
  }
  return response.json();
}

export async function calculatePremium(params) {
  const response = await fetch(`${API_BASE_URL}/api/calculate-premium`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to calculate premium');
  }
  return response.json();
}

export async function createPolicy(policyData) {
  const response = await fetch(`${API_BASE_URL}/api/policies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(policyData),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to create policy');
  }
  return response.json();
}

export async function fetchPolicies() {
  const response = await fetch(`${API_BASE_URL}/api/policies`);
  if (!response.ok) {
    throw new Error('Failed to fetch policies');
  }
  return response.json();
}

export async function simulateOracleTrigger(eventData) {
  const response = await fetch(`${API_BASE_URL}/api/oracle/simulate-trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Oracle simulation failed');
  }
  return response.json();
}

export async function fetchModelInfo() {
  const response = await fetch(`${API_BASE_URL}/api/model/info`);
  if (!response.ok) {
    throw new Error('Failed to fetch model info');
  }
  return response.json();
}
