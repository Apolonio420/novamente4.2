# Auditoría de Onboarding Partners — Diagnóstico y Propuestas

**Fecha:** 2026-05-26
**Autor:** Análisis técnico (Claude)
**Estado:** Diagnóstico — sin implementar todavía
**Origen:** Casos reportados por Elyar, Gabriel, Karina, Daniel

---

## TL;DR

El onboarding tiene **dos bloques rotos** y **tres bloques con fricción importante**:

**Rotos (urgente):**
1. **No hay nada en la plataforma que explique el modelo de negocio** una vez que el partner entra al workspace. El wizard de alta cubre branding/estilo, pero el "cómo cobro / cómo se factura / no necesitás MercadoPago" está ausente. Eso es exactamente lo que tropezó Gabriel.
2. **El campo CBU está en `Settings > Perfil` sin contexto ni jerarquía**. Etiqueta literal "CBU" + hint "22 dígitos". No dice "para recibir tus liquidaciones". Daniel y Gabriel cayeron acá.

**Fricción alta:**
3. **Studio vs Catálogo no es obvio**. Son dos secciones paralelas en el sidebar ("Studio" y "Catálogo" bajo "Tu Marca") sin pasarela que explique el flujo "diseñá → publicá". Un partner nuevo no sabe por dónde empezar (caso Karina: "¿y ahora qué?").
4. **El checklist del dashboard existe pero no explica nada**. Son 10 ítems sin orden, sin contexto, sin "siguiente paso". Funciona como tracker, no como guía.
5. **Subir un PNG propio no tiene un flujo dedicado**. Está mezclado dentro del editor de producto (max 5 imágenes) y dentro del Studio (como input para mockup IA). El caso de Elyar ("tengo diseños propios pero no puedo subir mi archivo") es real: no hay un "subí tu diseño" como acción primaria.

---

## 1. Diagnóstico por punto

### 1.1 Flujo de onboarding (registro → primer producto)

**Archivos clave:**
- [app/partners/join/page.tsx](app/partners/join/page.tsx) — wizard de 7 pasos
- [app/partners/login/page.tsx](app/partners/login/page.tsx) — login simple, redirige a `/workspace`
- [app/workspace/page.tsx](app/workspace/page.tsx) — dashboard post-login

**Qué pasa hoy:**

1. Alta en `/partners/join` — wizard largo (7 pasos según las constantes encontradas: Datos básicos → Identidad visual → Tipo partner → Estilo visual → Catálogo → Comercialización → Plan → Preview). Es **demasiado largo y carga progreso en localStorage** (`novamente_onboarding_progress`).
2. Después del alta, llega un email/redirect. Al loguearse en `/partners/login` cae en `/workspace` (línea 26 del login).
3. En el dashboard ve: cards de KPIs (productos/leads/orders/score), un **checklist de 10 ítems** sin priorización ([app/workspace/page.tsx:270-323](app/workspace/page.tsx#L270-L323)), feed de actividad y links rápidos.

**Problemas concretos:**

- **No hay "next step" claro**. El checklist es plano: "Subir logo / Agregar banner / Tagline / Descripción / Colores / 1+ producto / 3+ productos / Generar diseño IA / Industria / Publicar storefront". Cualquiera de esos 10 ítems podría ser el primero. Karina ("¿y ahora qué?") está mirando este checklist sin saber por dónde agarrar.
- **El ítem "Generar tu primer diseño con IA" tiene `done: false` hardcodeado** ([page.tsx:310](app/workspace/page.tsx#L310) con `TODO: track from design assets`). Es un bug: nunca se marca como hecho aunque el partner haya generado 10 diseños.
- **No hay tour guiado, modal de bienvenida, ni video walkthrough**. Cero tooltips contextuales (revisé Branding, Catalog, Settings, Design Engine).
- **Métricas inexistentes**: no encontré tracking de "tiempo desde alta hasta primer producto publicado" ni "step donde abandona". Solo hay `trackGenerateLead` en el wizard de alta. Sin esto no podemos saber qué % abandona en qué paso.

### 1.2 Studio vs Catálogo

**Archivos:**
- [app/workspace/design-engine/page.tsx](app/workspace/design-engine/page.tsx) — Studio (chat IA + mockups)
- [app/workspace/design-library/page.tsx](app/workspace/design-library/page.tsx) — galería de diseños generados
- [app/workspace/catalog/page.tsx](app/workspace/catalog/page.tsx) — gestión de productos manual
- [app/workspace/layout.tsx](app/workspace/layout.tsx) — sidebar (sección "Tu Marca")

**Qué pasa hoy:**

En el sidebar "Tu Marca" hay 4 entradas: **Branding**, **Studio** (design-engine), **Biblioteca** (design-library), **Catálogo**. Las cuatro son páginas separadas con UI propia.

- **Studio** = chat con IA donde el partner describe un diseño, la IA lo genera, lo aplica a un mockup (remera/buzo), y desde ahí puede "Publicar como producto".
- **Catálogo** = formulario tradicional de producto (nombre/descripción/precio/imágenes/colores/talles), botón "Copiar con IA" para autocompletar nombre+desc.
- **Biblioteca** = repositorio de PNGs generados en el Studio.

**Problemas:**

- **No hay ningún copy que explique la relación entre las 4 secciones**. Un partner abre "Studio" sin saber que es para diseñar, no para vender. Abre "Catálogo" sin saber que ahí van los productos finales.
- **Hay dos caminos paralelos para "crear un producto"**: desde Studio (publicar el mockup como producto) o desde Catálogo (crear manualmente). No hay UI que indique que existen dos caminos y cuál conviene cuándo.
- **"Biblioteca" no tiene función clara para el partner nuevo**. Es útil solo después de haber generado varios diseños.

### 1.3 Subida de PNG

**Archivos:**
- [app/api/partners/upload/route.ts](app/api/partners/upload/route.ts) — endpoint genérico
- [app/workspace/catalog/page.tsx](app/workspace/catalog/page.tsx) — `ImageUpload` dentro del editor de producto (máx 5)
- [app/workspace/design-engine/page.tsx](app/workspace/design-engine/page.tsx) — input para subir PNG como referencia/diseño para mockup

**Tipos permitidos:** `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`. No vi validación de resolución (300 DPI) ni de fondo transparente ni de tamaño en bytes en el cliente.

**Problemas:**

- **No hay un flujo dedicado "subí tu diseño propio"** como acción primaria del workspace. Para un partner como Elyar que llega con sus PNGs hechos, la pregunta es: ¿dónde los subo? La respuesta no es obvia. Los caminos posibles son:
  - Crear un producto en Catálogo y subir el PNG como una de las 5 imágenes del producto → pero eso es la imagen del producto, no "el diseño aplicado a la prenda".
  - Ir al Studio, usar el upload como input, generar un mockup → pero el Studio es chat-IA, no "aplicá este PNG exacto a esta remera".
- **No hay feedback visual claro de validación** (no vi mensajes de error por DPI bajo, fondo no transparente, peso excesivo).
- **No hay preview "tu PNG sobre la remera" como acción primaria de 1-2 clicks**. El partner tiene que entender el modelo mental del sistema antes de ver su diseño aplicado.

### 1.4 Comunicación del modelo de negocio

**Búsqueda exhaustiva:** revisé el dashboard, settings, branding, catalog, design-engine, workspace/layout. **No encontré copy en ninguna parte del workspace que explique:**

- Que el cliente final paga a Novamente, no al partner.
- Que el partner **NO necesita conectar MercadoPago / Stripe / ninguna pasarela**.
- Que la "ganancia partner" es la diferencia entre el precio mayorista (costo Novamente) y el precio público que el partner define.
- Cómo y cuándo se liquidan las ganancias al partner.

**Caso Gabriel:** "el bot me pasó este número porque no sé cómo poner la cuenta de Mercado Pago" → el partner asume que tiene que conectar pasarela porque **nada en la plataforma le dice lo contrario**. Probablemente vio el campo "CBU" en Settings y pensó "ah, acá conecto MP".

**En el catálogo, al cargar precio**, no hay desglose visible "tu costo / tu PVP / tu ganancia". Solo hay un campo `price: number | null` (línea 52 de catalog/page.tsx). No vi una calculadora de margen ni un breakdown.

### 1.5 Datos bancarios para liquidaciones

**Archivo:** [app/workspace/settings/page.tsx](app/workspace/settings/page.tsx) — líneas ~170-200

**Campos:**
- `cbu` (string, validación: exactamente 22 dígitos)
- `bank_alias` (string opcional)

**Etiquetas actuales:**
- Label: **"CBU"**
- Hint: **"Ingresa tu CBU de 22 dígitos"**

**Problemas:**

- **No dice para qué es**. "CBU" a secas se puede interpretar como (a) datos para recibir, (b) datos para cobrar, (c) datos para facturación. Daniel y Gabriel se confundieron.
- **Está enterrado en Settings > Perfil**, junto con otros 15 campos (logo, SEO, FAQs, commerce_mode, etc). No hay sección dedicada "Cobros y liquidaciones".
- **El campo `commerce_mode` está al lado del CBU** con opciones: `leads / quote / sample / whatsapp / external / checkout`. Un partner nuevo no entiende qué significa cada uno y la combinación con el CBU es confusa.

### 1.6 Primer producto / wizard de creación

**Catalog form (`/workspace/catalog`):**

1. Click "Agregar producto" → modal con campos: nombre, descripción, categoría, status (draft/published/hidden), imágenes (máx 5), colores, talles, features, tags, precio.
2. Botón "Copiar con IA" autocompleta nombre+descripción.
3. Guardar → producto en `draft`. Click "Publicar" → `published` → visible en `/merch/[slug]`.

**Problemas:**

- **No hay validación que obligue a poner precio** antes de publicar. El precio es `number | null`. Un partner puede publicar un producto sin precio.
- **No hay desglose de margen visible**. Donde el partner pone "$15.000" no aparece "tu costo: $X / tu ganancia: $Y".
- **No hay wizard "tu primer producto en 3 pasos"**. Es el mismo formulario para el primero que para el N-ésimo.
- **No hay preview antes de publicar**. El partner publica a ciegas y después tiene que ir a `/merch/[slug]` a ver cómo quedó.

### 1.7 Help / FAQ / soporte in-app

- **Sidebar tiene "Soporte"** (workspace/layout.tsx, sección Comunicación) pero **la carpeta `app/workspace/support/` existe sin página implementada**. Click probablemente da 404 o página vacía. **Esto es un bug visible al usuario.**
- **No hay tooltips** contextuales en ningún form.
- **No hay video walkthrough embebido**.
- **Existe Nova (asistente)** — el QMD indica que se acaba de unificar el asistente público + workspace en `PublicAssistant`. Esto es positivo: el partner tiene a Nova en el FAB esquina inferior derecha. **Pero Nova no es proactivo**: no abre un mensaje de bienvenida al primer login con "hola, te muestro cómo armar tu primer producto en 3 pasos".

### 1.8 Empty states

- **Dashboard:** "Agregá productos o configurá tu marca para comenzar" — vacío pero sin call-to-action fuerte.
- **Catálogo:** "Todavía no tenés productos" + botón "Agregar producto" — OK pero falta el "te recomendamos empezar por X".
- **Biblioteca:** "Visitá el Studio para comenzar" — bien, redirige.
- **Studio:** prompt visible + ejemplos — el mejor empty state del workspace.
- **Orders / Leads:** sin empty state cuidado, tabla en blanco.

---

## 2. Fricciones reales mapeadas a los casos

| Caso | Fricción real | Dónde está en el código |
|------|---------------|-------------------------|
| **Elyar** "no entiendo cómo configurar" | Dashboard con 10 ítems sin priorizar + sidebar de 15 secciones sin tour | [workspace/page.tsx:270](app/workspace/page.tsx#L270), [workspace/layout.tsx](app/workspace/layout.tsx) |
| **Elyar** "no entiendo cómo se vende" | Cero copy en workspace sobre flujo de pagos / liquidaciones | Ausencia total |
| **Elyar** "no puedo subir mi PNG" | No hay flujo dedicado "subí tu diseño propio" | Falta ruta; el upload está mezclado en catálogo y studio |
| **Gabriel** "no sé cómo poner MP" | Campo CBU sin contexto + cero copy "no necesitás pasarela" | [settings/page.tsx:~175](app/workspace/settings/page.tsx) |
| **Karina** "¿y ahora qué?" | Checklist sin orden ni "primer paso recomendado" + soporte 404 | [workspace/page.tsx:270](app/workspace/page.tsx#L270), `support/` vacío |
| **Daniel** "¿cuál sería mi ganancia?" | Catálogo no muestra desglose costo/PVP/ganancia | [catalog/page.tsx:52](app/workspace/catalog/page.tsx#L52) |

---

## 3. Propuestas concretas

Ordenadas por **impacto / esfuerzo**.

### 🔥 Alto impacto / Bajo esfuerzo (hacer ya)

**P1. Renombrar y agrupar el campo CBU.**
- Mover CBU + alias bancario a una sección dedicada "Cobros y liquidaciones" en Settings (o nueva entrada en sidebar).
- Label: **"Cuenta donde vas a recibir tus liquidaciones"**
- Hint: **"Acá depositamos tu ganancia cada vez que vendés. No necesitás conectar MercadoPago ni ninguna pasarela — el cliente le paga a Novamente y nosotros te liquidamos a esta cuenta."**
- Esfuerzo: 1-2h. Resuelve directamente Gabriel + Daniel.

**P2. Banner explicativo en el dashboard "Cómo funciona el modelo".**
- Card colapsable en `/workspace` (encima del checklist) con 3 bullets:
  - "El cliente le paga directo a Novamente — no necesitás pasarela."
  - "Nosotros producimos y enviamos cuando hay venta."
  - "Te liquidamos tu ganancia (PVP − costo) cada [periodo] a tu CBU."
- Card descartable después de la primera lectura (guardar en `tenant.onboarding_dismissed_business_model`).
- Esfuerzo: 2-3h. Resuelve Elyar + Gabriel.

**P3. Implementar la página `/workspace/support` o quitarla del sidebar.**
- El link "Soporte" existe en la nav pero la página probablemente da 404. Esto es percepción de plataforma rota.
- Mínimo viable: página estática con FAQ + botón "Hablar con Nova" + WhatsApp directo a Juan Ignacio.
- Esfuerzo: 1-2h.

**P4. Fix bug del checklist "diseño IA".**
- En [workspace/page.tsx:310](app/workspace/page.tsx#L310), el ítem "Generar tu primer diseño con IA" tiene `done: false` hardcodeado. Hay que conectar con la tabla de diseños/sesiones del Studio.
- Esfuerzo: 1h.

**P5. Validar que producto publicado tenga precio.**
- En el modal de "Publicar" del catálogo, bloquear publicación si `price === null`. Mensaje: "Necesitás definir un precio antes de publicar."
- Esfuerzo: 30min.

### 🚀 Alto impacto / Medio esfuerzo

**P6. Quick-start "tu primer producto en 3 pasos" en el dashboard.**
- Componente arriba del checklist actual, para tenants con 0 productos:
  - Paso 1: Subí tu logo (link Branding)
  - Paso 2: Subí tu primer diseño o generalo con IA (link Studio)
  - Paso 3: Publicá tu primer producto (link Catalog)
- Cuando los 3 estén hechos, se reemplaza por el checklist completo actual.
- Esfuerzo: 1 día.

**P7. Desglose de margen en el formulario de producto.**
- En catalog, al lado del campo precio, mostrar:
  ```
  Tu PVP:       $15.000
  Costo Novamente: $7.500
  Tu ganancia: $7.500 (50%)
  ```
- Esto requiere tener el costo Novamente accesible por producto/talle, que ya debería existir en `lib/partners/garment-pricing.ts`.
- Esfuerzo: 1-2 días.

**P8. Acción primaria "Subí tu diseño" en el dashboard.**
- Card prominente en el dashboard: "¿Tenés un diseño listo? Subilo en 1 click" → abre un drop zone con preview inmediato sobre mockup → guarda en Biblioteca → ofrece "Publicar como producto".
- Resuelve directamente el caso Elyar.
- Esfuerzo: 2-3 días.

**P9. Nova proactivo en el primer login.**
- Al detectar `tenant.created_at < 24h` y `tenant.onboarding_completed === false`, Nova abre un mensaje de bienvenida con 3 opciones rápidas: "¿Cómo funciona el modelo?" / "Ayudame a subir mi primer diseño" / "Mostrame cómo configurar mi tienda".
- Esfuerzo: 1 día (la infra de Nova ya existe, agregar trigger por estado).

### 🐢 Medio impacto / Alto esfuerzo

**P10. Tour interactivo paso a paso** (Shepherd.js / Driver.js) que recorre el workspace.
- Solo si los puntos 1-9 no resuelven. Tours largos suelen ser ignorados.

**P11. Métricas de funnel de onboarding.**
- Trackear: `signup → first_login → branding_complete → first_design → first_product_draft → first_product_published → first_lead → first_order`.
- Almacenar en tabla `partner_funnel_events` o usar PostHog/Mixpanel.
- Esfuerzo: 2-3 días para infra básica.

### 🧹 Limpieza recomendada

- **Acortar el wizard de alta**. Hoy son 7 pasos (datos / identidad / tipo partner / estilo / catálogo / comercialización / plan / preview). Para un partner que solo quiere probar, esto es demasiado. Considerar versión "express" de 2 pasos (mail + business name) y mover el resto al workspace.
- **Unificar "Studio" y "Biblioteca"** en una sola sección "Diseños" con tabs. Reduce confusión de Karina.

---

## 4. Priorización sugerida (sprint de 1-2 semanas)

**Semana 1 (quick wins, ~1 día de trabajo):**
- P1, P3, P4, P5 — todos juntos cubren los casos Gabriel + Daniel + bug visible.
- P2 — banner explicativo (medio día).

**Semana 2 (impacto profundo):**
- P6 — quick-start de primer producto.
- P9 — Nova proactivo de bienvenida.

**Semana 3+ (si los anteriores no movieron la aguja):**
- P7 — desglose de margen.
- P8 — upload de PNG como acción primaria.
- P11 — métricas de funnel (esto debería ir primero si querés medir el impacto de P1-P9, pero necesitás haber hecho cambios para tener qué medir).

---

## 5. Métricas a trackear (cuando tengamos infra)

| Métrica | Cómo medir | Por qué importa |
|--------|------------|-----------------|
| Time-to-first-product | `published_at` del primer producto − `created_at` del tenant | Mide la fricción total del onboarding |
| Drop-off por paso del wizard | Eventos en cada step de `/partners/join` (el wizard ya guarda en localStorage, sería fácil mandar eventos) | Saber dónde se caen en el alta |
| % partners con CBU cargado / total | Query a `tenants` donde `cbu IS NOT NULL` | Indicador de "configuración mínima para cobrar" |
| % partners que llegan a publicar 1 producto | `products.count() > 0` por tenant | Indicador de activación real |
| % partners que llegan a su primera venta | join con `orders` | Conversion final |
| Tickets de soporte por tema | Categorizar tickets de Nova (ya hay infra `/api/assistant/ticket`) | Detectar nuevas fricciones |

---

## 6. Cosas que vi de paso y conviene anotar

- El wizard de alta usa `localStorage` con key `novamente_onboarding_progress` ([join/page.tsx:326](app/partners/join/page.tsx#L326)) — si el usuario cambia de dispositivo, pierde el progreso.
- `sessionStorage.getItem('nv_onboarding_session')` se usa para uploads durante el wizard ([join/page.tsx:303](app/partners/join/page.tsx#L303)) — está OK pero si el navegador limpia sessionStorage en medio del flujo, los archivos quedan huérfanos en R2.
- Hay un campo `partner_type: 'catalog_only' | 'catalog_mockups' | 'catalog_design_engine'` en el wizard (paso 3) — vale la pena revisar si esa elección se respeta después en la UI del workspace o queda como dato muerto.
- En el dashboard, el `score` (Storefront Score) está al lado del checklist pero **no se explica cómo se calcula**. Un partner ve "tu score es 30%" sin saber qué hacer.

---

## Cierre

Mi recomendación: **arrancar por P1-P5 esta semana**. Son <1 día de trabajo total y atacan directamente 3 de los 4 casos reales que pasaste. Después medimos si los reclamos bajan y decidimos si seguimos con P6-P9 o ajustamos el plan.

Cualquier punto que querramos descartar, agregar o reordenar lo discutimos antes de tocar código.
