# Videos de /ayuda — cómo re-grabar

Los 3 tutoriales de `/ayuda` (Studio, Catálogo, B2C) se graban con Playwright
contra el tenant fixture E2E, nunca contra el tenant interno ni con
credenciales reales. Esto reemplaza a los viejos `scripts/record-*-video.mjs`
(borrados — tenían una contraseña real hardcodeada y grababan el tenant
interno, filtrando badge PRO/Admin, precio retail y el email interno).

## 1. Seed del tenant fixture

```bash
npx tsx scripts/seed-e2e-partner.ts --with-products --with-branding --with-orders
```

Crea (idempotente, por slug) el tenant `e2e-partner-test` con:
- `--with-products`: 3 productos reales publicados (Remera Dragon Neon, Buzo
  Aurora, Tote Botánica) — así el catálogo no muestra skeletons ni imágenes
  rotas.
- `--with-branding`: logo (`public/branding/aurora-estudio-logo.png`),
  banner, colores y tagline/descripción — así desaparece el banner naranja
  "te falta cargar tu logo" y el storefront queda auto-publicado. **Ojo**: el
  video `branding` (sección 6 abajo) necesita mostrar el estado SIN branding
  — ver la nota dentro de `marketing_assets/faq-videos/STORYBOARDS.md`
  sección 2 antes de correr este flag si todavía no se grabó ese video.
- `--with-orders`: 3 pedidos demo (`Cliente de Prueba`,
  `cliente@novamente.test`, `metadata.fixture: true`) en los estados
  Pendiente / En producción / Entregado, para que `/workspace/orders` no
  esté vacío. Insertado directo en `partner_orders` via service-role
  (bypassea `POST /api/partners/orders`, así que no dispara el aviso de
  Telegram/email que sí dispara ese endpoint — ver
  `app/api/partners/orders/README.md`).

Requiere en `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `E2E_PARTNER_EMAIL`, `E2E_PARTNER_PASSWORD`.

**Pendiente de limpieza manual** (no lo pudo hacer ningún agente — el
auto-clasificador de permisos de Claude Code bloquea un DELETE contra
`partner_orders` desde este flujo): quedan 3 filas viejas y ajenas a este
seed, "Cliente Test E2E" / Cancelado, huérfanas de corridas anteriores de
`e2e/partner-load-order.spec.ts` (ese spec crea un pedido de prueba y solo
lo cancela, nunca lo borra). Van a aparecer mezcladas con los 3 pedidos
fixture de arriba en `/workspace/orders` y "Cliente Test E2E" es justamente
el tipo de texto que `assertNoLeaks` rechaza (matchea `/E2E/i`) — hay que
borrarlas a mano antes de grabar el video `orders`:

```sql
delete from partner_orders
where tenant_id = '8778ec9f-680d-4d84-a3d6-527057834e46'
  and customer_name = 'Cliente Test E2E'
```

Nota: `e2e/record-studio-video.spec.ts` crea un producto nuevo ("Remera Dragon
Neon") cada vez que corre (no es idempotente esa parte del flujo — es la app
real creando un producto real). Si el catálogo del tenant fixture acumula
productos de más (de esto o de otros specs que usan el mismo tenant), borrá
los que no matcheen los 3 slugs `e2e-remera-dragon-neon` / `e2e-buzo-aurora` /
`e2e-tote-botanica` antes de grabar catalog — si no, el video de catálogo
muestra ruido.

## 2. Transcribir la narración (una sola vez, o si cambian los audios)

Los 13 clips de narración (`marketing_assets/audio_openai_*.mp3`) se
transcriben con la API de OpenAI (`whisper-1`) para saber cuándo empieza
realmente cada frase y ajustar el timing de las acciones en pantalla. El
resultado ya está en `marketing_assets/narration.json`. Si se re-graban los
audios, hay que regenerar ese archivo (usa `OPENAI_API_KEY` de `.env.local`).

## 3. Grabar

```bash
npx playwright test e2e/record-studio-video.spec.ts
npx playwright test e2e/record-catalog-video.spec.ts
```

Sin `E2E_PARTNER_EMAIL`/`E2E_PARTNER_PASSWORD` en el entorno, ambos specs se
SKIPEAN (no corren en una pasada normal de `npx playwright test`). Corren
contra `http://localhost:3000` (baseURL default de `playwright.config.ts`) —
levantar `npm run dev` antes.

Cada spec:
- Planta la sesión del partner via password grant de Supabase (localStorage +
  cookie), arranca la grabación ya adentro de `/workspace` — nunca tipea un
  email en pantalla.
- Inyecta un cursor falso + ripple de click (mismo look que los scripts
  viejos) y oculta el precio retail / hint de retail del panel de Prendas
  Base con CSS (`data-testid="garment-retail-price"` y
  `"garment-retail-price-hint"` en `app/workspace/design-engine/page.tsx`).
- Corta la grabación con un error explícito (`[LEAK DETECTED]`) si en algún
  checkpoint aparece texto "retail", "Admin", "Internal" o un email
  `@novamente.ar` — en vez de guardar un video con un leak.
- Navega entre páginas del workspace con `page.goto()` (navegación dura) en
  vez de confiar en el click real de un `<Link>`: un click real dispara una
  transición client-side de Next.js que, si se interrumpe, puede dejar la
  página destino colgada en su fetch inicial de datos para siempre (bug
  reproducido durante el desarrollo de estos specs). El cursor + ripple se
  muestran igual (`ripplePreview`, sin click real) para que el video se vea
  guiado.
- Escribe `marketing_assets/video_{studio,catalog}_raw/latest.webm` +
  `marketing_assets/sync_{studio,catalog}.json` (offsets `[AUDIO_SYNC]` en
  segundos desde el arranque de la grabación).

Flakiness conocida: bajo carga pesada de la máquina o después de MUCHAS
corridas seguidas (rate-limit transitorio de Supabase Auth), el fetch inicial
de una página del workspace puede tardar más de lo normal. Los specs esperan
hasta 30-45s en los puntos críticos; si igual falla, esperar ~1 min y
reintentar suele alcanzar.

## 4. Mux (mezclar audio + overlay + faststart)

```bash
node scripts/mux-marketing-video.mjs \
  --video marketing_assets/video_studio_raw/latest.webm \
  --sync marketing_assets/sync_studio.json \
  --audio-prefix marketing_assets/audio_openai_ \
  --overlay-prefix marketing_assets/overlay_ \
  --out public/ayuda/studio.mp4

node scripts/mux-marketing-video.mjs \
  --video marketing_assets/video_catalog_raw/latest.webm \
  --sync marketing_assets/sync_catalog.json \
  --audio-prefix marketing_assets/audio_openai_catalog_ \
  --overlay-prefix marketing_assets/overlay_catalog_ \
  --out public/ayuda/catalog.mp4
```

Cada corrida también genera `<out>-preview.mp4` (mudo, primeros 6s, ~480p,
bitrate bajo, faststart) — es lo que usa `components/ayuda/VideoCard.tsx` en
el `preview` prop al hacer hover.

El script recorta la placa de "capítulo" que las imágenes `overlay_*.png`
traen pegada arriba (choca con el logo del navbar) y deja solo el subtítulo
de abajo, ya en el tercio inferior del frame.

Reglas de duración: el video termina 1.0s después de que termina el último
clip de audio; el audio se rellena con silencio hasta esa duración exacta.

### B2C — `e2e/record-b2c-video.spec.ts`

`public/ayuda/b2c.mp4` (el único tutorial público de `/ayuda`, no vive en
`/workspace/support`) SÍ se re-graba con este pipeline desde septiembre
2026 — reemplaza al viejo remux directo de
`marketing_assets/MARKETING_B2C_OPENAI_POLISHED.mp4` (un video nunca
grabado con este sistema, que tenía un desync narración/pantalla cerca de
t≈40s y una fecha de entrega vieja quemada en el checkout). Storyboard
completo: `marketing_assets/faq-videos/STORYBOARDS.md` sección "b2c".

Distinto de todos los demás specs de esta sección: es flujo **B2C público**
(Home → `/crear` → carrito → checkout), **sin login, sin tenant fixture, sin
`hideRetailPrice`** (esos testids son del workspace de partner). Requiere IA
real (`POST /api/generate-image`, costo chico) — sin credenciales que
skipear, corre siempre:

```bash
npx playwright test e2e/record-b2c-video.spec.ts
```

Escribe `marketing_assets/video_b2c_raw/latest.webm` +
`marketing_assets/sync_b2c.json`. Mux (estilo placa vieja, con
`--overlay-prefix` SIN `--overlay-no-crop`, igual que studio/catalog):

```bash
node scripts/mux-marketing-video.mjs \
  --video marketing_assets/video_b2c_raw/latest.webm \
  --sync marketing_assets/sync_b2c.json \
  --audio-prefix marketing_assets/audio_openai_b2c_ \
  --overlay-prefix marketing_assets/overlay_b2c_ \
  --out public/ayuda/b2c.mp4
```

Antes de sobreescribir, copiar el `public/ayuda/b2c.mp4` vigente a
`marketing_assets/b2c-previous.mp4` (gitignorado por
`marketing_assets/*.mp4`). Poster: un frame limpio del Canvas con el diseño
ya aplicado a la prenda, sin caption ni modal encima —
`ffmpeg -ss <t> -i public/ayuda/b2c.mp4 -frames:v 1 -q:v 2 public/ayuda/b2c-poster.jpg`.

**Gotcha real, encontrado en corridas de grabación** (server de dev
compartido con otra sesión activa, tráfico pesado simultáneo): el click en
"Crear gratis" del launcher de la landing (`CrearLauncher.tsx`) a veces
dispara el submit **nativo** del `<form>` en vez del `onSubmit` de React
(el input no tiene `name`, así que el submit nativo aterriza en `/?` con
query vacía) — muy probablemente una carrera de hidratación bajo carga
pesada del server compartido. El spec reintenta (`submitPromptAndReachCrear`,
hasta 3 intentos, cada uno recupera volviendo a Home y re-tipeando) y todo
ese tramo queda recortado del video final con `sync.cut()` (no aporta nada
bajo la caption 3, que ya se cubre con la escritura del prompt).

**Gotcha real #2**: el store del carrito (zustand con `persist` a
localStorage, `lib/cartStore.tsx:115`) rehidrata de forma asíncrona — al
navegar a `/cart` justo después de agregar un producto, aparece un frame de
"Tu carrito está vacío" antes de que la rehidratación complete. El spec
recorta ese tramo con `sync.cut()` también (ver el comentario en el spec,
sección "Carrito → Checkout").

**ffmpeg lento/colgado bajo carga compartida**: si el mux tarda minutos en
vez de segundos con la máquina compartida por otra sesión corriendo su
propio ffmpeg al mismo tiempo, es contención de CPU, no necesariamente un
deadlock del filter graph — confirmado corriendo el mismo filter_complex
exacto de forma standalone (con `-preset ultrafast` para acotar el tiempo
de prueba), que terminó en segundos. Aun así, correr el mux siempre en
foreground acotado con un timeout explícito (nunca en background sin
límite) y nunca más de un ffmpeg propio en simultáneo.

## 5. Verificar antes de dar por terminado

```bash
# ffprobe: dimensiones + duración video/audio (deben coincidir <= 0.1s)
for f in public/ayuda/studio.mp4 public/ayuda/catalog.mp4 public/ayuda/b2c.mp4; do
  ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of csv=p=0 "$f"
  ffprobe -v error -select_streams a:0 -show_entries stream=duration -of csv=p=0 "$f"
done

# faststart (moov antes que mdat)
ffprobe -v trace public/ayuda/studio.mp4 2>&1 | grep -m2 -E "type:'(moov|mdat)'"

# Frames cada 3s para revisar visualmente (sin skeletons, sin leaks, cursor
# visible, mockup completado, plates sin tapar el navbar)
ffmpeg -i public/ayuda/studio.mp4 -vf "fps=1/3" /tmp/frames/f%02d.png
```

## 6. Videos del FAQ del workspace (7 en total)

`/workspace/support` → `components/workspace/SupportFaq.tsx` embebe 7
tutoriales, uno por pregunta, en este orden: **studio, catalog, pricing,
branding, share-link, orders, support-ticket**. Los primeros dos (`studio`,
`catalog`) son los tutoriales originales de `/ayuda` movidos adentro del
workspace (sección 1-5 de este archivo); los otros 5 (`pricing`, `branding`,
`share-link`, `orders`, `support-ticket`) se agregaron después, en dos
tandas. Todo lo necesario para re-grabarlos vive en
`marketing_assets/faq-videos/`: `STORYBOARDS.md` (URL exacta, selectores,
qué ocultar por video), `narration.json` (guiones de los 5 clips/video) y
`audio_<key>_<n>.mp3` (22 clips ya generados con `scripts/tts-narration.mjs`).

### 6.1 Specs de grabación

Un spec por video, mismo patrón que `record-studio-video.spec.ts` /
`record-catalog-video.spec.ts`: `e2e/record-share-link-video.spec.ts`,
`record-branding-video.spec.ts`, `record-orders-video.spec.ts`,
`record-pricing-video.spec.ts`, `record-support-ticket-video.spec.ts`. Cada
uno marca `sync.mark(n)` por clip de `narration.json[key].clips` y escribe
`marketing_assets/video_<key>_raw/latest.webm` +
`marketing_assets/sync_<key>.json`.

**Nota — `orders` necesita limpieza de DOM antes de cada checkpoint**: la
base tiene filas huérfanas "Cliente Test E2E" / Cancelado (ver sección 1
arriba, un DELETE bloqueado por el permission system) que se mezclan con los
3 pedidos fixture. `record-orders-video.spec.ts` las oculta con un helper
`hideOrphanTestRows()` local al spec, llamado antes de cada
`assertNoLeaks()`. **Importante**: ese helper usa
`el.style.display = 'none'`, **NUNCA `el.remove()`** — la primera versión sí
usaba `remove()` y reventaba la página con un error boundary ("Algo salió
mal") en cuanto React volvía a re-renderizar esa lista (ej. al cambiar de
filtro, que dispara un nuevo fetch + re-render del `<tbody>`): React sigue
esas filas como propias, y sacarlas del árbol real por fuera de su
reconciliador lo deja con una referencia rota que explota al día siguiente
render. `display:none` no interfiere con la reconciliación (mismo patrón no
destructivo que `hideRetailPrice`). El pedido fixture "nuevo" también avanza
de estado real (pending → confirmed → producing) al grabar — restaurar con
`npx tsx scripts/seed-e2e-partner.ts --with-orders` después de grabar.

**Nota — `pricing` muta precios reales**: el bulk-price de la categoría
"Remera Oversize" (+10%) sí pega contra `/api/partners/catalog/bulk-price` de
verdad. Restaurar con `npx tsx scripts/seed-e2e-partner.ts --with-products`
después de grabar. Ojo con el seed: si el producto fixture cambió de forma
tal que el script no lo encuentra por slug, crea uno NUEVO en vez de
actualizar el existente y queda un duplicado en el catálogo — confirmar
`GET /api/partners/catalog` devuelve exactamente 3 productos después de
sembrar, y borrar el sobrante con `DELETE /api/partners/catalog/<id>` si no.

**Nota — `catalog` (el tutorial original, no uno de los 5 nuevos)**: su
`sync.mark(3)` original estaba ANTES de abrir el modal "Agregar producto",
pero la acción real (llenar el form → cancelar → volver a la grilla) tarda
más que `audio_openai_catalog_3.mp3` + el buffer de 1.5s de
`scripts/mux-marketing-video.mjs` — el mux cortaba el video con el modal
todavía abierto, violando la regla de terminar en un estado de éxito
(encontrado en un review frame-by-frame tras re-mux-ear con la regla de cola
actual). Se movió `sync.mark(3)` a después de confirmar que la grilla está
de vuelta visible — la narración ahora acompaña el estado final, no el modal.

### 6.2 Mux con overlay PNG (no drawtext)

Los 5 videos nuevos usan `--overlay-prefix ... --overlay-no-crop` (placas PNG
1280×720 transparentes, solo el subtítulo abajo, generadas con
`node scripts/render-captions.mjs`), **no** el modo `--captions` (drawtext)
de `scripts/mux-marketing-video.mjs`: el `ffmpeg` de Homebrew en esta máquina
no tiene `libfreetype`/`libfontconfig` (`ffmpeg -filters | grep drawtext` no
devuelve nada), así que `--captions` no es usable acá. Comando real usado
(mismo patrón para los 5, cambiando el key):

```bash
node scripts/render-captions.mjs --only pricing   # genera overlay_pricing_1..4.png

node scripts/mux-marketing-video.mjs \
  --video marketing_assets/video_pricing_raw/latest.webm \
  --sync marketing_assets/sync_pricing.json \
  --audio-prefix marketing_assets/faq-videos/audio_pricing_ \
  --overlay-prefix marketing_assets/faq-videos/overlay_pricing_ \
  --overlay-no-crop \
  --out public/ayuda/pricing.mp4
```

### 6.3 Duraciones actuales (ffprobe, m:ss)

studio 0:40 · catalog 0:28 · pricing 0:28 · branding 0:34 · share-link 0:32 ·
orders 0:27 · support-ticket 0:25.
