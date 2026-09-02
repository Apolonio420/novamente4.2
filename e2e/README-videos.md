# Videos de /ayuda — cómo re-grabar

Los 3 tutoriales de `/ayuda` (Studio, Catálogo, B2C) se graban con Playwright
contra el tenant fixture E2E, nunca contra el tenant interno ni con
credenciales reales. Esto reemplaza a los viejos `scripts/record-*-video.mjs`
(borrados — tenían una contraseña real hardcodeada y grababan el tenant
interno, filtrando badge PRO/Admin, precio retail y el email interno).

## 1. Seed del tenant fixture

```bash
npx tsx scripts/seed-e2e-partner.ts --with-products
```

Crea (idempotente, por slug) el tenant `e2e-partner-test` con 3 productos
reales publicados (Remera Dragon Neon, Buzo Aurora, Tote Botánica) — así el
catálogo no muestra skeletons ni imágenes rotas. Requiere en `.env.local`:
`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `E2E_PARTNER_EMAIL`,
`E2E_PARTNER_PASSWORD`.

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

### B2C (no se re-graba)

`public/ayuda/b2c.mp4` se remuxea directo desde
`marketing_assets/MARKETING_B2C_OPENAI_POLISHED.mp4` (no hay spec de
grabación — el video viejo ya estaba bien, solo le faltaba faststart). El
original ya NO vive en `public/` (era públicamente alcanzable y filtraba
info interna en los otros dos videos hermanos, MARKETING_CATALOG y
MARKETING_DEMO, que se borraron del repo por eso mismo):

```bash
node scripts/mux-marketing-video.mjs \
  --video marketing_assets/MARKETING_B2C_OPENAI_POLISHED.mp4 \
  --out public/ayuda/b2c.mp4 \
  --remux-only
```

Sin `--trim-after`, el modo remux corta 1s después del final del audio. Ojo:
en la versión actual del video B2C el contenido DESPUÉS del audio (carrito →
checkout) es real y relevante, no una cola muda — por eso el mux actual se
hizo con `--trim-after 56.92` (mantiene el video completo, 57.92s). Si se
re-graba el audio de B2C, revisar de nuevo si conviene cortar o no antes de
mux-ear.

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
