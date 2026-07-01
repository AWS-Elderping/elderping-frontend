import * as client from './apiClient';
import { API_BASE } from './config';

const BASE = API_BASE.appointment;

/**
 * Book an appointment for an elder.
 * @param {{ elderId: number, doctorName: string, clinicName?: string, scheduledAt: string, hospitalName?: string, doctorSpecialty?: string, notes?: string }} payload
 */
export const createAppointment = (payload) => client.post(`${BASE}/appointments`, payload);

export const getElderAppointments = (elderId) => client.get(`${BASE}/appointments/elder/${elderId}`);
export const getUpcomingAppointments = (elderId) => client.get(`${BASE}/appointments/upcoming/${elderId}`);
