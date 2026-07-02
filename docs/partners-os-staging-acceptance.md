# Partners OS 4.2 — harness de aceptación de staging

El harness [verify-partners-os-staging.ts](../scripts/verify-partners-os-staging.ts)
crea tenants, usuarios y saldo de prueba con un prefijo único, valida los
controles de rol/RLS, flags de rollout y la idempotencia de retiros, y los
elimina en un bloque `finally`.

No carga `.env.local` ni usa credenciales `NEXT_PUBLIC_*` o
`SUPABASE_SERVICE_ROLE_KEY`. Sólo acepta estas variables inyectadas por el
runner de staging:

- `PARTNERS_STAGING_SUPABASE_URL`
- `PARTNERS_STAGING_SERVICE_ROLE_KEY`
- `PARTNERS_STAGING_ANON_KEY`
- `PARTNERS_STAGING_BASE_URL`
- `PARTNERS_STAGING_CONFIRM=RUN_PARTNERS_OS_ACCEPTANCE`

Las dos URL deben contener `staging`, `preview`, `dev` o `localhost`; si no,
el proceso se detiene antes de abrir conexiones. Para ejecutarlo de forma
deliberada, luego de aplicar migraciones y desplegar el candidato con CRM,
cockpit y fulfillment apagados:

```powershell
$env:PARTNERS_STAGING_CONFIRM = 'RUN_PARTNERS_OS_ACCEPTANCE'
npx tsx scripts/verify-partners-os-staging.ts
```

Si la limpieza automática no puede terminar, el script imprime solamente el
prefijo y los IDs de fixtures para su borrado manual; nunca imprime secretos.
