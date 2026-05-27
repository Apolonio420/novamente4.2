/**
 * Plan limits for partner features.
 * Add new limits here as features are gated by plan.
 */

export const DESIGN_UPLOAD_LIMIT_BY_PLAN: Record<string, number> = {
  starter: 20,
  growth: 100,
  pro: Infinity,
}

export function getDesignUploadLimit(plan: string): number {
  return DESIGN_UPLOAD_LIMIT_BY_PLAN[plan] ?? DESIGN_UPLOAD_LIMIT_BY_PLAN.starter
}
