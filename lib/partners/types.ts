export type Plan = 'starter' | 'growth' | 'pro'
export type TenantStatus = 'onboarding' | 'active' | 'paused' | 'suspended'
export type TenantRole = 'owner' | 'operator' | 'viewer'
export type DesignEngineMode = 'disabled' | 'mockups_only' | 'presets' | 'full_brand_fit'
export type CommerceMode = 'leads' | 'quote' | 'sample' | 'whatsapp' | 'external' | 'checkout'
export type VisualStyle = 'minimal' | 'bold' | 'editorial' | 'sport' | 'corporate' | 'urbano' | 'creativo'
export type ProductStatus = 'draft' | 'needs_review' | 'ready' | 'published' | 'hidden' | 'archived'

export interface Tenant {
  id: string
  slug: string
  name: string
  email: string
  phone: string | null
  country: string
  currency: string
  industry: string | null
  website: string | null
  instagram: string | null
  description: string | null

  // Branding
  logo_url: string | null
  banner_url: string | null
  hero_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string | null
  font_preference: string
  tagline: string | null
  about_text: string | null
  cta_text: string
  cta_url: string | null

  // Plan & status
  plan: Plan
  status: TenantStatus

  // Config
  storefront_published: boolean
  design_engine_mode: DesignEngineMode
  commerce_mode: CommerceMode
  visual_style: VisualStyle

  // Limits
  max_products: number
  max_leads_per_month: number

  // SEO
  seo_indexable: boolean
  seo_title: string | null
  seo_description: string | null
  custom_faqs: { question: string; answer: string }[] | null

  // Subscription
  billing_cycle: 'monthly' | 'annual' | null
  subscription_started_at: string | null
  subscription_expires_at: string | null
  mp_subscription_id: string | null
  last_payment_at: string | null
  payment_failures: number

  // Bank info
  bank_cbu: string | null
  bank_alias: string | null

  // Chatbot
  catalog_pdf_url: string | null

  // Metadata
  completeness_score: number
  onboarding_step: number
  onboarding_completed: boolean
  onboarding_dismissed_business_model: boolean

  // Free-form integration data (TikTok tokens, Meta tokens, etc.)
  metadata?: Record<string, unknown>

  // Funnel timestamps (set once, WHERE field IS NULL)
  first_login_at: string | null
  first_branding_save_at: string | null
  first_design_at: string | null
  first_product_draft_at: string | null
  first_product_published_at: string | null
  storefront_published_at: string | null

  created_at: string
  updated_at: string
}

export interface TenantUser {
  id: string
  tenant_id: string
  user_id: string
  role: TenantRole
  invited_by: string | null
  accepted_at: string | null
  created_at: string
}

export interface PartnerProduct {
  id: string
  tenant_id: string
  name: string
  description: string | null
  category: string | null
  subcategory: string | null
  brand: string | null
  slug: string
  price: number | null
  compare_at_price: number | null
  currency: string
  availability: string
  status: ProductStatus
  images: string[]
  tags: string[]
  collection: string | null
  seo_title: string | null
  seo_description: string | null
  metadata: Record<string, unknown>
  sort_order: number
  created_at: string
  updated_at: string
}

export interface PartnerLead {
  id: string
  tenant_id: string
  name: string | null
  email: string | null
  phone: string | null
  message: string | null
  source: string
  product_interest: string | null
  status: string
  metadata: Record<string, unknown>
  created_at: string
}
