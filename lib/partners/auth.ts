/**
 * Partner auth — backward-compatible surface.
 *
 * The implementation now lives in ./permissions (centralized tenant
 * authorization). This module is kept as a thin re-export so existing
 * `import { getRequestTenant } from '@/lib/partners/auth'` callers keep working.
 *
 * New code should import requireTenantPermission from '@/lib/partners/permissions'
 * so every mutation and sensitive read checks an explicit Permission.
 */
export {
  ADMIN_EMAILS,
  getAdminUser,
  getRequestTenant,
  resolveRequestUser,
  requireTenantPermission,
  hasPermission,
  decideAccessStatus,
  resolveActiveTenant,
  ROLE_PERMISSIONS,
} from './permissions'

export type {
  Permission,
  TenantResolution,
  TenantAuthResult,
} from './permissions'
