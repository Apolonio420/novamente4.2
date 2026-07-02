-- Tenant-aware RLS for partner tables (P0: tenant isolation).
--
-- Problem this fixes:
--   The original policies were named "Service role full access" but declared as
--   `FOR ALL USING (true) WITH CHECK (true)` with NO `TO service_role` clause.
--   In Postgres a policy with no role list applies to PUBLIC — i.e. to `anon`
--   and `authenticated` as well. So any client using the anon/authenticated key
--   could read or write EVERY tenant's rows. (The app itself uses the service
--   role key, which bypasses RLS, so this was a latent hole for any direct
--   client/Realtime access.)
--
-- Fix:
--   - Restrict the blanket policies to `TO service_role` only (backend keeps
--     full access; it also has BYPASSRLS, so this is belt-and-suspenders).
--   - Add tenant-scoped *read* policies for `authenticated`: a user may only
--     read rows of tenants they are an accepted member of. All writes go through
--     backend routes using service_role, where requireTenantPermission enforces
--     the owner/operator/viewer matrix. This prevents a client from bypassing
--     that matrix by calling PostgREST directly.
--   - Preserve the intentional public-read policies for published storefronts
--     and products (and extend them to variants).
--
-- Idempotent and data-preserving (only drops/creates policies + one function).
-- Apply with: psql "$DATABASE_URL" -f migrations/20260622_partner_rls_tenant_aware.sql
--
-- ROLLOUT NOTE: the dashboard uses Supabase Realtime, which enforces RLS. After
-- applying, verify Realtime subscriptions still receive a member's own tenant
-- rows (they should — and they will no longer leak other tenants'). Take a
-- backup before applying in production.

-- Membership check used by every policy. SECURITY DEFINER so it can read
-- tenant_users without being subject to tenant_users' own RLS (avoids recursion).
create or replace function is_tenant_member(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from tenant_users tu
    where tu.tenant_id = p_tenant_id
      and tu.user_id = auth.uid()
      and tu.accepted_at is not null
  );
$$;

-- Ensure RLS is on (idempotent).
alter table tenants                  enable row level security;
alter table tenant_users             enable row level security;
alter table partner_products         enable row level security;
alter table partner_product_variants enable row level security;
alter table partner_assets           enable row level security;
alter table partner_leads            enable row level security;
alter table partner_design_config    enable row level security;
alter table partner_orders           enable row level security;
alter table partner_discount_codes   enable row level security;

-- 1) Scope the blanket "Service role full access" policies to service_role only.
drop policy if exists "Service role full access" on tenants;
create policy "Service role full access" on tenants                  for all to service_role using (true) with check (true);
drop policy if exists "Service role full access" on tenant_users;
create policy "Service role full access" on tenant_users             for all to service_role using (true) with check (true);
drop policy if exists "Service role full access" on partner_products;
create policy "Service role full access" on partner_products         for all to service_role using (true) with check (true);
drop policy if exists "Service role full access" on partner_product_variants;
create policy "Service role full access" on partner_product_variants for all to service_role using (true) with check (true);
drop policy if exists "Service role full access" on partner_assets;
create policy "Service role full access" on partner_assets           for all to service_role using (true) with check (true);
drop policy if exists "Service role full access" on partner_leads;
create policy "Service role full access" on partner_leads            for all to service_role using (true) with check (true);
drop policy if exists "Service role full access" on partner_design_config;
create policy "Service role full access" on partner_design_config    for all to service_role using (true) with check (true);
drop policy if exists "Service role full access" on partner_orders;
create policy "Service role full access" on partner_orders           for all to service_role using (true) with check (true);
drop policy if exists "Service role full access" on partner_discount_codes;
create policy "Service role full access" on partner_discount_codes   for all to service_role using (true) with check (true);

-- 2) Tenant-scoped READ access for authenticated users (accepted members).
--
-- IMPORTANT: do not create INSERT/UPDATE/DELETE policies for authenticated.
-- Every mutation is deliberately performed by the backend service_role after
-- requireTenantPermission has applied the application role matrix. Without this,
-- a viewer could bypass the API and mutate its tenant through PostgREST.

-- tenants: members can read their own tenant. All writes stay backend-only.
drop policy if exists "Members read their tenants" on tenants;
create policy "Members read their tenants" on tenants
  for select to authenticated using (is_tenant_member(id));
drop policy if exists "Members update their tenants" on tenants;

-- tenant_users: a user can see their own memberships and the team of tenants
-- they belong to. Writes (invitations) stay backend-only (service role).
drop policy if exists "Members read tenant team" on tenant_users;
create policy "Members read tenant team" on tenant_users
  for select to authenticated using (user_id = auth.uid() or is_tenant_member(tenant_id));

-- Products / assets / leads / design config: member reads only.
drop policy if exists "Members manage their products" on partner_products;
drop policy if exists "Members read their products" on partner_products;
create policy "Members read their products" on partner_products
  for select to authenticated using (is_tenant_member(tenant_id));

drop policy if exists "Members manage their assets" on partner_assets;
drop policy if exists "Members read their assets" on partner_assets;
create policy "Members read their assets" on partner_assets
  for select to authenticated using (is_tenant_member(tenant_id));

drop policy if exists "Members manage their leads" on partner_leads;
drop policy if exists "Members read their leads" on partner_leads;
create policy "Members read their leads" on partner_leads
  for select to authenticated using (is_tenant_member(tenant_id));

drop policy if exists "Members manage their design config" on partner_design_config;
drop policy if exists "Members read their design config" on partner_design_config;
create policy "Members read their design config" on partner_design_config
  for select to authenticated using (is_tenant_member(tenant_id));

-- Variants: tenant resolved through the parent product.
drop policy if exists "Members manage their variants" on partner_product_variants;
drop policy if exists "Members read their variants" on partner_product_variants;
create policy "Members read their variants" on partner_product_variants
  for select to authenticated
  using (exists (select 1 from partner_products pp where pp.id = product_id and is_tenant_member(pp.tenant_id)));

-- Orders: this table previously retained a PUBLIC `FOR ALL USING (true)` policy.
-- Members may now only read their own tenant's orders; API writes use service_role.
drop policy if exists "Members read their orders" on partner_orders;
create policy "Members read their orders" on partner_orders
  for select to authenticated using (is_tenant_member(tenant_id));

-- Discounts use an older set of membership-only policies. Replace them so a
-- viewer cannot create, edit, or delete commercial discounts through PostgREST.
drop policy if exists partner_discounts_select on partner_discount_codes;
drop policy if exists partner_discounts_insert on partner_discount_codes;
drop policy if exists partner_discounts_update on partner_discount_codes;
drop policy if exists partner_discounts_delete on partner_discount_codes;
drop policy if exists "Members read their discounts" on partner_discount_codes;
create policy "Members read their discounts" on partner_discount_codes
  for select to authenticated using (is_tenant_member(tenant_id));

-- 3) Preserve / restate the intentional public-read policies.
drop policy if exists "Public can read published tenants" on tenants;
create policy "Public can read published tenants" on tenants
  for select using (storefront_published = true and status = 'active');

drop policy if exists "Public can read published products" on partner_products;
create policy "Public can read published products" on partner_products
  for select using (status = 'published');

drop policy if exists "Public can read variants of published products" on partner_product_variants;
create policy "Public can read variants of published products" on partner_product_variants
  for select using (
    exists (select 1 from partner_products pp where pp.id = product_id and pp.status = 'published')
  );

-- 4) Privileges: RLS policies alone do not revoke SQL/PostgREST privileges.
-- Deny every direct table mutation to browser roles, then explicitly grant
-- read-only access. service_role remains the only application mutator.
revoke all privileges on table
  tenants,
  tenant_users,
  partner_products,
  partner_product_variants,
  partner_assets,
  partner_leads,
  partner_design_config,
  partner_orders,
  partner_discount_codes
from public, anon, authenticated;

grant select on table
  tenants,
  partner_products,
  partner_product_variants
to anon;

grant select on table
  tenants,
  tenant_users,
  partner_products,
  partner_product_variants,
  partner_assets,
  partner_leads,
  partner_design_config,
  partner_orders,
  partner_discount_codes
to authenticated;

grant all privileges on table
  tenants,
  tenant_users,
  partner_products,
  partner_product_variants,
  partner_assets,
  partner_leads,
  partner_design_config,
  partner_orders,
  partner_discount_codes
to service_role;

-- Verification (run manually against the DB, as an `authenticated` user of tenant A):
--   set request.jwt.claim.sub = '<user of tenant A>';
--   select count(*) from partner_leads;                 -- only tenant A's leads
--   select count(*) from partner_leads where tenant_id = '<tenant B>'; -- 0 rows
--   update partner_orders set status = 'cancelled' where tenant_id = '<tenant A>'; -- permission denied
--   delete from partner_products where tenant_id = '<tenant A>';                  -- permission denied
-- As service_role, the two mutations above must succeed through the backend.
