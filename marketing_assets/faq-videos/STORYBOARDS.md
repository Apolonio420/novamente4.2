# Storyboards — 5 videos nuevos de FAQ del workspace

Fase 1 de este trabajo (investigación + prerequisitos). Fase 2 (otro agente)
escribe los 5 specs de grabación (`e2e/record-<key>-video.spec.ts`, mismo
patrón que `e2e/record-studio-video.spec.ts` / `record-catalog-video.spec.ts`)
y graba. Este documento tiene todo lo necesario para que esa fase sea
mecánica: URL exacta, texto visible de cada elemento a clickear/tipear,
selector estable sugerido, y qué debe ocultarse.

Convenciones que ya existen en el pipeline (ver `e2e/fixtures/video-recording.ts`
y no las repito por video):
- Sesión plantada vía `loginAndGoTo(page, request, path)` — nunca tipear el
  email en pantalla.
- `injectFakeCursor` + `clickWithRipple`/`moveCursorTo`/`ripplePreview` para
  el cursor falso.
- `hideRetailPrice` + `suppressDevOverlay` al arrancar, `assertNoLeaks(page,
  checkpoint)` en cada checkpoint.
- Navegación entre páginas del workspace con `page.goto()` duro (nunca click
  real de `<Link>`) — ver el comentario largo en `e2e/README-videos.md`
  sección 3 sobre por qué.
- `makeAudioSync(startTime)` con `sync.mark(n)` en cada arranque de clip de
  narración, `sync.cut(from,to)` para esperas muertas, `sync.end()` al final.
- Tenant fixture: `e2e-partner-test` / "Aurora Estudio", ya seedeado con
  `--with-products --with-branding --with-orders` (ver sección
  "Prerequisitos" más abajo).

Todas las capturas de referencia de este documento están en
`/private/tmp/claude-501/-Users-sambujuan-novamente-dev-chatbot/1bc2d8fc-a8d5-421f-993a-2213025139e8/scratchpad/shot_*.png`
(tomadas contra localhost con la sesión del partner fixture plantada, SIN
`hideRetailPrice` — son solo para research, no se usan en el video final).

---

## 1. `share-link` — Cómo compartir el link de tu tienda

**Link real a comunicar:** `https://www.novamente.ar/p/<slug>` — **nunca**
subdominios, **nunca** `/merch/<brand>`. Verificado en el código: los TRES
lugares donde el workspace ofrece este link apuntan consistentemente a
`/p/${tenant.slug}` (no hay discrepancia que corregir):
- `app/workspace/layout.tsx:478-484` — sidebar, footer, siempre visible en
  toda página del workspace: link con ícono `ExternalLink`, texto **"Ver mi
  storefront"**, `href={`/p/${tenant.slug}`}`, `target="_blank"`.
- `app/workspace/layout.tsx:632-638` — dropdown de usuario (topbar), texto
  **"Ver storefront"**, mismo href.
- `app/workspace/page.tsx:988-997` (Dashboard) — botón violeta arriba a la
  derecha, texto **"Ver tienda"**, mismo href, siempre visible si
  `tenant.slug` existe (no depende de si la tienda ya está publicada).

Hay además un banner condicional en el Dashboard
(`StorefrontVisibilityBanner`, `app/workspace/page.tsx:568-673`) con botón
**"Copiar link"** que copia `https://www.novamente.ar/p/<slug>` al
clipboard — pero SOLO se muestra si la tienda está `suspended`, o si NO está
publicada y ya tiene ≥1 producto publicado, o justo después de publicarla
(`storefrontJustPublished`, estado de sesión). Con el tenant fixture ya
seedeado y publicado, este banner **no** aparece en una visita normal — no
usar este banner como paso central del storyboard (solo mencionar en la
narración que "cuando publiques por primera vez, también vas a ver un botón
para copiar el link ahí mismo").

### Pasos
1. `loginAndGoTo(page, request, '/workspace')` — Dashboard.
2. `assertNoLeaks(page, 'dashboard')`.
3. Cursor a botón **"Ver tienda"** (`app/workspace/page.tsx:993`, dentro de
   `<Link href={`/p/${data.tenant.slug}`} target="_blank">`). Selector
   sugerido: `page.getByRole('link', { name: /Ver tienda/i })`. `target="_blank"`
   abre una pestaña nueva — en Playwright hay que capturar el evento `'page'`
   del context (`context.waitForEvent('page')`) para grabar la tienda pública
   en la MISMA ventana en vez de perder el foco en una pestaña nueva sin
   grabar. Alternativa más simple y robusta para grabación: en vez de
   clickear el link real (que abre pestaña nueva), hacer `ripplePreview`
   sobre el botón (se ve el hover/click) y luego `page.goto('/p/<slug>')` con
   navegación dura en la MISMA página — mismo patrón que ya usan los specs
   existentes para evitar líos de nueva pestaña/SPA nav a medio cargar.
4. En la tienda pública (`/p/e2e-partner-test`): mostrar el hero con logo
   "AURORA ESTUDIO", nombre "Aurora Estudio", tagline "Diseños propios,
   estampados a pedido" (ver `shot_public_store.png` — así se ve hoy con el
   branding ya seedeado). Sostener unos segundos.
5. Opcional: scroll corto para mostrar productos publicados en la grilla
   pública (usa los 3 productos fixture).
6. Volver al workspace (`page.goto('/workspace')`) y mostrar brevemente el
   link **"Ver mi storefront"** del sidebar (siempre visible, abajo a la
   izquierda) como "también lo encontrás acá en cualquier página".

### Qué debe ocultarse
- Todo lo estándar (`hideRetailPrice`). En la vista pública `/p/<slug>` no
  hay "Iniciar sesión o registrarse" que filtre nada del partner — es una
  página 100% pública, no requiere `hideRetailPrice` ahí (no hay sesión de
  partner visible), pero SÍ mantenerlo activo en las partes `/workspace/*`
  del video.
- Nada nuevo que agregar a `HIDDEN_LEAK_TESTIDS`.

### Narración sugerida (ver `narration.json` para el texto final)
Mostrar: botón "Ver tienda" → la tienda pública abierta → el link
"Ver mi storefront" del sidebar. Mencionar el formato del link
(`novamente.ar/p/tu-marca`) y que se comparte por WhatsApp/redes.

---

## 2. `branding` — Cómo cargar tu logo y la identidad de marca

**Importante — conflicto de estado con el prerequisito B:** el seed
`--with-branding` (sección "Prerequisitos") deja el tenant fixture YA
publicado con logo/colores/tagline cargados — esto es a propósito para que
los OTROS 4 videos no muestren el banner naranja "te falta cargar tu logo".
Pero ESTE video necesita mostrar el ANTES (banner naranja, sin logo) y el
DESPUÉS (guardado → toast de auto-publish). Recomendación para la Fase 2:

> Grabar este video ANTES de correr `--with-branding` por primera vez (con
> el tenant recién creado, sin branding), o clonar temporalmente los campos
> de branding a `null`/vacío con el service-role client justo antes de
> grabar (mismo patrón que `ensureTenant`, un `UPDATE tenants SET logo_url =
> null, banner_url = null, primary_color = '#000000', tagline = null WHERE
> slug = 'e2e-partner-test'`) y volver a correr `--with-branding` después
> para dejar el tenant en el estado "bueno" que necesitan los otros 4 videos.
> No se implementó un flag `--reset-branding` en esta fase — si Fase 2 lo
> quiere, es un `ensureBranding` a la inversa, mismo archivo.

### Pasos (asumiendo el estado "antes": sin logo)
1. `loginAndGoTo(page, request, '/workspace/branding')`.
2. Esperar a que cargue (skeleton visible ~1-2s, ver `shot_branding.png` —
   esperar el mismo patrón que usa `waitVisibleWithReload` en los specs
   existentes, ej. esperar el tab "Imágenes" visible).
3. Mostrar el banner naranja "Te falta cargar tu logo" (o el estado
   `missing_logo`/`missing_cover_or_description` de
   `StorefrontVisibilityBanner`, visible en el Dashboard, NO en esta página
   — si se quiere mostrar el banner, hacerlo con un paso extra por
   `/workspace` antes de ir a `/workspace/branding`). Alternativa más simple
   y autocontenida: arrancar directo en `/workspace/branding` y narrar sobre
   la ausencia de logo en el preview de la página misma
   (`app/workspace/branding/page.tsx:146-150`, el círculo de preview de logo
   vacío).
4. Tab **"Imágenes"** (primer tab, ya activo por default) → click en el área
   de **Logo** (`ImageUpload`, `type="logo"`, `app/workspace/branding/page.tsx:494`)
   → subir el logo generado por el seed
   (`public/branding/aurora-estudio-logo.png` o el que haya elegido el
   prerequisito B — usar `page.setInputFiles` sobre el `<input type=file>`
   que `ImageUpload` monta). Mostrar el preview del logo aplicado.
5. Tab **"Colores y tipografía"** → click en una paleta predefinida (grid de
   `COLOR_PALETTES`, botones con nombre de paleta — elegir una que no sea la
   default `#000000`) → mostrar los 3 swatches (Primario/Secundario/Acento)
   actualizarse.
6. Click botón **"Guardar"** (header sticky, `app/workspace/branding/page.tsx:405-417`).
   Selector sugerido: `page.getByRole('button', { name: /Guardar/i })`.
7. Esperar el toast de éxito. Si `auto_published === true` (logo + tagline/banner
   ya alcanza el mínimo), el toast dice **"🎉 ¡Listo! Tu storefront ya está
   publicado y visible en novamente.ar"** (`app/workspace/branding/page.tsx:318`)
   — este es el pago visual del video, sostenerlo 2-3s.

### Qué debe ocultarse
- Estándar. Nada nuevo. El `ImageUpload` no muestra nombres de archivo con
  paths locales sensibles — confirmar en la grabación real que el nombre de
  archivo temporal que Playwright sube no queda visible en el DOM (no
  debería, el componente sube y muestra la URL final, no el nombre local).

---

## 3. `orders` — Qué pasa cuando entra un pedido

Página: `/workspace/orders` ("Pedidos" en el sidebar). Columnas de la tabla:
Cliente / Items / Total / Estado / Fecha (ver `shot_orders.png`, aunque esa
captura es ANTES del seed de pedidos — Fase 2 debe re-verificar contra
`shot_orders_seeded.png` si el agente de prerequisitos lo generó, o tomar
una propia). Filtros por tab: Todos / Pendiente / Confirmado / En producción
/ Enviado / Entregado / Con incidencia / Cancelado
(`STATUS_CONFIG`, `app/workspace/orders/page.tsx:69-112`).

### Pasos
1. `loginAndGoTo(page, request, '/workspace/orders')`.
2. Esperar la grilla con los 2-3 pedidos fixture (ver sección
   "Prerequisitos" — statuses `confirmed`("Confirmado"), `producing`("En
   producción"), `delivered`("Entregado")).
3. Mostrar la fila con estado **"En producción"** (`bg-amber-500/20`, ícono
   `Factory`) — click sobre la fila para abrir el detalle
   (`onClick` en la Card, o el patrón equivalente en esta página — revisar
   si abre modal o panel lateral; en el código hay un componente de detalle
   con `events` (historial: `fulfillment_changed`, `tracking_updated`,
   `note`, `exception`) y `STATUS_TRANSITIONS[order.status]` con botones
   para avanzar el estado).
4. Mostrar el panel de detalle: datos del cliente (usar el nombre fixture
   "Cliente de Prueba" — legible y no alarmante en pantalla), items, total,
   estado actual, y los botones de transición de estado disponibles (ej.
   "Marcar como Enviado" — el label exacto depende de `STATUS_TRANSITIONS`,
   verificar contra el código al grabar, NO clickear ningún botón que
   dispare un side-effect real como notificación al cliente).
5. Cerrar el detalle, volver a la grilla, mostrar brevemente el filtro por
   tab (ej. click en "Entregado") para mostrar cómo se filtra.

### Qué debe ocultarse
- Estándar. Verificar que ningún campo interno (costo proveedor, margen,
  metadata de `whatsapp_orders` de platform-master) se filtre — según
  `app/api/partners/orders/README.md`, `partner_orders` NUNCA guarda costo
  proveedor ni margen, así que no debería haber nada que ocultar acá, pero
  confirmar visualmente en la grabación real (el campo `notes`/eventos podría
  en teoría tener texto libre si algo se cargó mal — con los pedidos fixture
  controlados por el seed esto no debería pasar).
- Si el detalle de pedido muestra `customer_email`, usar el email fixture
  `@novamente.test` del seed (ya cubierto por los patrones LEAK existentes
  que excluyen específicamente `@novamente.test`, ver `LEAK_PATTERNS` en
  `video-recording.ts` — OJO: el patrón genérico `/@[\w.-]+\.(com|ar|test)\b/i`
  en esa misma lista SÍ matchea `@novamente.test`, así que
  `assertNoLeaks` VA A FALLAR si el email fixture queda visible en pantalla.
  **Acción para Fase 2**: o bien el pedido fixture no debe mostrar el email
  completo en ningún checkpoint narrado (ocultarlo del DOM con un testid
  nuevo si hace falta), o ajustar el seed para que el order detail no
  exponga ese campo en el checkpoint filmado. No se resolvió en esta fase —
  documentado para que Fase 2 no se sorprenda con el spec fallando por
  `[LEAK DETECTED]`.

---

## 4. `pricing` — Cambiar precios de a uno y en masa

Página: `/workspace/catalog`.

### Pasos
1. `loginAndGoTo(page, request, '/workspace/catalog')`.
2. Esperar grilla con 3 productos fixture (ver `shot_catalog.png` — ya
   confirmado con el seed de branding corrido, se ve "Aurora Estudio" /
   STARTER / 3 productos / botones "Cambio masivo de precios" y "Agregar
   producto" arriba a la derecha).
3. **Precio individual**: click en la card de **"Remera Dragon Neon"**
   (`onClick={() => openEditForm(product)}` en la Card, `app/workspace/catalog/page.tsx:770`)
   → se abre el modal de edición → click en el campo **"Precio"**
   (`#product-price`) → borrar y escribir un valor nuevo con `fillAndVerify`
   (ej. `33000`) → click **"Guardar cambios"** (label exacto:
   `formMode === 'create' ? 'Crear producto' : 'Guardar cambios'`, aquí
   estamos en modo edit → "Guardar cambios",
   `app/workspace/catalog/page.tsx:1463`). Confirmar que la grilla vuelve a
   mostrar el precio actualizado.
4. **Precio masivo**: click botón **"Cambio masivo de precios"**
   (`app/workspace/catalog/page.tsx:600-606`) → se abre el modal → elegir
   categoría (selector con las categorías reales del fixture: "Remera
   Oversize" / "Buzo Hoodie Oversize" / "Accesorio" — usar una, ej. "Remera
   Oversize") → elegir tipo de cambio: dejar en **"Precio fijo"** (default) o
   click **"Ajuste por %"** para mostrar la otra opción → escribir un valor
   (ej. `10` con modo % → "+10 % a toda la categoría") → click **"Aplicar a
   todos"**. NOTA: esto SÍ ejecuta un cambio real (`POST
   /api/partners/catalog/bulk-price`) sobre el tenant fixture — es
   aceptable (mismo patrón que el resto del pipeline, que sí interactúa con
   datos reales del tenant fixture), pero Fase 2 debe dejar los precios en
   un valor sensato al final de la corrida (o el video se puede volver a
   grabar sin problema — es idempotente conceptualmente, el precio del
   fixture no importa mientras sea plausible) — **cancelar en vez de aplicar**
   es la opción más segura si no se quiere mutar el fixture: mostrar el modal
   cargado, sostener unos segundos, click "Cancelar" (mismo patrón ya usado
   en `record-catalog-video.spec.ts` con el modal de alta de producto).
5. Terminar en la grilla con los 3 productos visibles y sus precios.

### Qué debe ocultarse
- **CRÍTICO en esta página en particular**: el banner **"Costo base de
  prendas Novamente"** (`data-testid="catalog-garment-cost-panel"`,
  `app/workspace/catalog/page.tsx:742`, visible en `shot_catalog.png` justo
  debajo del buscador) — YA está cubierto por `HIDDEN_LEAK_TESTIDS` en
  `video-recording.ts`, no hace falta agregar nada, pero confirmar
  `assertNoLeaks` en el checkpoint de la grilla inicial.
- El modal de edición individual tiene la sección **"Prenda base (opcional,
  para calcular tu margen)" + `<MarginBreakdown>`**
  (`data-testid="catalog-form-margin-breakdown"`, ya cubierto) — si se abre
  el modal de edición para cambiar el precio, ese bloque queda oculto por
  CSS pero SIGUE MONTADO en el DOM; confirmar con `assertHiddenLeaksAreHidden`
  que de verdad está `display:none` en ese checkpoint (no solo que el CSS
  esté inyectado).

---

## 5. `support-ticket` — Cómo pedir ayuda creando un ticket

Página: `/workspace/support` ("Soporte" en el sidebar).

### Pasos
1. `loginAndGoTo(page, request, '/workspace/support')`.
2. Mostrar el header "Soporte" + la sección de FAQ ya existente (ver
   `shot_support.png`) — sostener 1-2s para dar contexto de que hay FAQs
   antes de crear un ticket.
3. Click botón **"Nuevo ticket"** (arriba a la derecha,
   `app/workspace/support/page.tsx:233-237`, toggle de `showForm`).
4. Formulario: campo **"Asunto"** (`#subject`, placeholder "Describe
   brevemente tu consulta") → `fillAndVerify` con un texto plausible, ej.
   "No me deja subir un logo en Branding". Selector **"Categoría"**
   (`#category`, `CATEGORY_OPTIONS`) → dejar el default o elegir una opción
   visible en pantalla. Campo **"Descripción"** (textarea, placeholder
   "Explica tu problema o consulta con detalle...") → texto corto plausible.
5. Click **"Enviar ticket"** (`app/workspace/support/page.tsx:333`,
   `disabled={creating || !subject.trim() || !description.trim()}`). ESTO
   CREA UN TICKET REAL en la tabla de soporte del tenant fixture — aceptable
   (ídem nota de precio masivo arriba), pero Fase 2 debería usar un asunto
   que dentro del sistema de soporte interno se identifique fácilmente como
   fixture (ej. prefijo o el propio contenido "No me deja subir un logo..."
   ya es inocuo y no dispara nada raro — no hay evidencia en el código leído
   de que crear un ticket disparo notificación a un canal compartido de
   soporte real fuera del propio admin de tickets; si Fase 2 quiere
   confirmarlo, grep `app/api/partners/support` por `notifyOps`/Telegram
   antes de grabar).
6. Mostrar el ticket recién creado en la lista de abajo, con su estado
   **"Abierto"** (`STATUS_CONFIG.open`, amarillo).

### Qué debe ocultarse
- Estándar. Nada nuevo — esta página no tiene precios ni prendas base.

---

## Elementos nuevos a agregar como `data-testid` (si Fase 2 los necesita)

No se encontró ningún leak NUEVO sin cobertura en las páginas storyboardeadas
— la lista `HIDDEN_LEAK_TESTIDS` existente ya cubre todo lo que aparece en
`/workspace/branding`, `/workspace/catalog`, `/workspace/support` y el
Dashboard. La única duda real es el email `@novamente.test` en el detalle de
un pedido (`orders`, punto 4 arriba) — que ya dispara `LEAK_PATTERNS`
existente (no hace falta agregar nada al detector, es una cuestión de qué
mostrar en pantalla, no de qué ocultar con CSS).
