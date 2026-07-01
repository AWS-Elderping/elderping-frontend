import * as client from './apiClient';
import { API_BASE } from './config';

const BASE = API_BASE.audit;

export const listAuditEvents = (page = 1, limit = 50) =>
  client.get(`${BASE}/audit?page=${page}&limit=${limit}`);
