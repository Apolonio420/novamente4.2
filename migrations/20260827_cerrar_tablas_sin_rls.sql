-- ---------------------------------------------------------------------------
-- Cierra la lectura anónima de las tablas que nunca activaron RLS.
--
-- QUÉ PASABA
-- Después de cerrar orders/tenants/partner_products (migración del 26/08) se
-- barrió el resto del esquema: 39 tablas de `public` tenían RLS DESACTIVADO y
-- el rol `anon` con permiso de SELECT. Probadas una por una con la anon key
-- —que viaja en el bundle del navegador— respondieron 34 de 34.
--
-- Lo que quedaba a la vista de cualquiera:
--   partner_support_messages  136 filas  conversaciones de soporte con partners
--   partner_support_tickets    37
--   partner_design_messages   868 filas  los chats del Studio de cada partner
--   partner_design_sessions    40
--   ad_leads                   83 filas  leads de campañas
--   partner_analytics_events 2922 filas  analytics de cada tienda
--   sace_event_log           5277 filas  log de eventos del bot
--   customer_assets            56
--   receipts / sales / super_credits / broadcast_logs / dashboard_audit ...
--
-- QUÉ SE DEJA ABIERTO Y POR QUÉ
-- Tres tablas SÍ las lee la app con el cliente anónimo (verificado con un grep
-- de `supabase.from(` sobre todo el repo): `images` y `cart_items` desde
-- lib/db.ts, y `partner_applications` desde app/api/partners/route.ts. A esa
-- última se la pasa a supabaseAdmin en el mismo commit y se cierra acá.
--
-- `images` y `cart_items` quedan abiertas a propósito: cerrarlas rompería la
-- galería de /crear y el carrito. Migrarlas a service_role es trabajo aparte,
-- anotado como pendiente.
-- ---------------------------------------------------------------------------

REVOKE ALL ON sace_event_log FROM anon;
REVOKE ALL ON partner_analytics_events FROM anon;
REVOKE ALL ON public_imagegen_requests FROM anon;
REVOKE ALL ON partner_design_messages FROM anon;
REVOKE ALL ON partner_design_sessions FROM anon;
REVOKE ALL ON partner_generation_usage FROM anon;
REVOKE ALL ON bot_guard_log FROM anon;
REVOKE ALL ON media_files FROM anon;
REVOKE ALL ON assets_catalog FROM anon;
REVOKE ALL ON partner_support_messages FROM anon;
REVOKE ALL ON partner_support_tickets FROM anon;
REVOKE ALL ON ad_leads FROM anon;
REVOKE ALL ON customer_assets FROM anon;
REVOKE ALL ON super_credits FROM anon;
REVOKE ALL ON sent_assets_queue FROM anon;
REVOKE ALL ON broadcast_logs FROM anon;
REVOKE ALL ON partner_activation_tickets FROM anon;
REVOKE ALL ON asset_packs FROM anon;
REVOKE ALL ON chat_templates FROM anon;
REVOKE ALL ON products FROM anon;
REVOKE ALL ON styles FROM anon;
REVOKE ALL ON dashboard_audit FROM anon;
REVOKE ALL ON winning_patterns FROM anon;
REVOKE ALL ON wa_demo_sessions FROM anon;
REVOKE ALL ON receipts FROM anon;
REVOKE ALL ON tiktok_scheduled_posts FROM anon;
REVOKE ALL ON message_impressions FROM anon;
REVOKE ALL ON coupons FROM anon;
REVOKE ALL ON coupon_usages FROM anon;
REVOKE ALL ON sales FROM anon;
REVOKE ALL ON operation_event_log FROM anon;
REVOKE ALL ON super_action_requests FROM anon;
REVOKE ALL ON webhook_idempotency_keys FROM anon;
REVOKE ALL ON partner_onboarding_calls FROM anon;
REVOKE ALL ON prompt_evolutions FROM anon;
REVOKE ALL ON bug_reports FROM anon;
REVOKE ALL ON broadcast_locks FROM anon;
REVOKE ALL ON failed_outbound FROM anon;
REVOKE ALL ON partner_applications FROM anon;

-- Que las tablas que se creen de acá en adelante no nazcan abiertas.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
