import * as client from './apiClient';
import { API_BASE } from './config';

const BASE = API_BASE.finops;

// URL pattern: BASE + '/finops/' + endpoint
// /api/finops/finops/dashboard → strip /api/finops → /finops/dashboard → router at /finops + route /dashboard

export const getFinopsDashboard       = ()  => client.get(`${BASE}/finops/dashboard`);
export const getFinopsRecommendations = ()  => client.get(`${BASE}/finops/recommendations`);
export const applyRecommendation      = (id) => client.post(`${BASE}/finops/recommendations/${id}/apply`, {});
export const dismissRecommendation    = (id) => client.post(`${BASE}/finops/recommendations/${id}/dismiss`, {});
