import * as client from './apiClient';
import { API_BASE } from './config';

const BASE = API_BASE.ai;

export const queryAI = (data) => client.post(`${BASE}/ai/query`, data);
export const getAIStatus = () => client.get(`${BASE}/ai/provider-status`);
export const getAiInteractions = () => client.get(`${BASE}/ai/interactions`);
