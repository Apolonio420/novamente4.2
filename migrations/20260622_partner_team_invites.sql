-- Team invitations support: look up an auth user by email.
--
-- Owners invite teammates by email. tenant_users.user_id is NOT NULL and
-- references auth.users, so an invite targets an EXISTING account. This helper
-- resolves the email → user id. SECURITY DEFINER so it can read auth.users.
--
-- Idempotent. Apply with:
--   psql "$DATABASE_URL" -f migrations/20260622_partner_team_invites.sql

create or replace function partner_find_user_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

-- SECURITY DEFINER functions receive EXECUTE for PUBLIC by default. This one
-- reads auth.users, so it must only be callable by the backend service role;
-- otherwise an anon client can enumerate registered accounts by email.
revoke execute on function public.partner_find_user_by_email(text)
  from public, anon, authenticated;
grant execute on function public.partner_find_user_by_email(text)
  to service_role;
