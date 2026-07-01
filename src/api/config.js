/**
 * Centralized API path configuration.
 *
 * All paths are relative — nginx proxies them to the correct
 * backend service. This makes the frontend work identically on
 * localhost, an EC2 instance, or any Kubernetes ingress without
 * any code changes.
 *
 *   /api/auth/*      → auth-service:3000
 *   /api/health/*    → health-service:3000
 *   /api/reminder/*  → reminder-service:3000
 *   /api/alert/*     → alert-service:3000
 */
export const API_BASE = {
  auth:        '/api/auth',
  health:      '/api/health',
  reminder:    '/api/reminder',
  alert:       '/api/alert',
  notes:       '/api/notes',
  ai:          '/api/ai',
  finops:      '/api/finops',
  // appointment-service and audit-service register routes under their own
  // /appointments and /audit path segments (unlike health/notes/alert, whose
  // routes have no self-prefix) - nginx strips the /api/<service>/ prefix,
  // so the call site needs this second segment to still land on the right route.
  appointment: '/api/appointments',
  audit:       '/api/audit',
};
