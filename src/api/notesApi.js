import * as client from './apiClient';
import { API_BASE } from './config';

const BASE = API_BASE.notes;

export const getNotes    = (elderId)  => client.get(`${BASE}/notes/${elderId}`);
export const createNote  = (data)     => client.post(`${BASE}/notes`, data);
export const deleteNote  = (id)       => client.del(`${BASE}/notes/${id}`);
export const generateAiNote = (data)  => client.post(`${BASE}/notes/ai`, data);
