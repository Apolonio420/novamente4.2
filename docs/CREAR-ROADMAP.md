# /crear · Roadmap Autónomo

**Goal**: La ultimate designing tool de Novamente — fácil, rápida, optimizada para CONVERSIÓN A VENTA.

**Source of truth**: este archivo. Cualquier cambio sobre /crear se refleja acá.

---

## ⚠️ Claims permitidos — leer SIEMPRE antes de tocar copy

Antes de agregar cualquier texto de venta, leer `CLAIMS-PERMITIDOS.md` en la raíz del repo.
**NUNCA decir:** "3 cuotas sin interés", "te lo rehacemos gratis", "frisa interior densa", "costuras reforzadas", gramajes que no sean 300 (buzos), 250 (remeras), 150 (crops/musculosas), "los buzos llevan cordones".
**SÍ se puede decir:** producción a pedido, 100% argentino, envío a todo el país, pagás con Mercado Pago, gramajes confirmados.

---

## ⚙️ Sistema operativo

- **Owner del desarrollo**: Claude (autonomous)
- **Budget mensual Gemini API**: $100 USD (~2500 imágenes)
- **Prioridad #1**: Conversión a venta
- **Prioridad device**: Mobile-first en UX, paridad en features
- **Reportes al usuario**: Solo si hay decisión o algo roto en prod
- **Cadencia**: 3-5 tareas por sesión, commits atómicos
- **Tests**: Playwright e2e antes de cada push significativo

---

## 📊 Métricas de éxito (conversion funnel)

Tracking actual via Meta Pixel + GA4:

| Evento | Endpoint | Estado |
|---|---|---|
| PageView (`/crear`) | FacebookPixel.tsx | ✅ |
| ViewContent (design generado) | DesignChat | ⚠️ falta |
| AddToCart | DesignChat handleAddToCart | ✅ |
| InitiateCheckout | DesignChat handleAddToCart | ⚠️ falta |
| Purchase | /checkout/success | ✅ |

**Goal**: medir baseline de conversión semanal y mejorar 20% en 4 semanas.

---

## 🐛 Bugs conocidos

| ID | Bug | Severidad | Status |
|---|---|---|---|
| B1 | Mockup canvas estático con checker pattern (legacy) | medium | ✅ resuelto (cambio a lifestyle Gemini) |
| B2 | Mockup mostraba prenda incorrecta cuando user cambiaba tarjeta | high | ✅ resuelto (8d02c22 + 1ac086a) |
| B3 | Storefront partner no se publicaba automáticamente | high | ✅ resuelto (7e08f49) |

---

## ✅ Completado (orden cronológico)

| Fecha | Commit | Cambio | Test |
|---|---|---|---|
| 2026-05-20 | 327208b | Mockup LIFESTYLE con Gemini | manual |
| 2026-05-20 | 1ac086a | Fix garment descriptions (sweatshirt, classic-women) | playwright 4 garments ✓ |
| 2026-05-20 | 7e08f49 | Auto-publish storefront cuando se carga branding | DB query ✓ |
| 2026-05-20 | 8d02c22 | Stale mockup + talle visible + galería + share + front/back | manual |

---

## 🔄 En progreso

(vacío)

---

## 📋 Backlog priorizado (foco: CONVERSIÓN)

### P0 — Críticos (semana 1)

- [x] **C-01** ✅ Trust signals visibles en /crear: "100% argentino · Envío todo el país · 30 días para cambios"
  - **Hipótesis**: usuarios abandonan porque no confían que sea real / legítimo
  - **Test**: snippet de testimonios + badges visibles
- [x] **C-02** ✅ ViewContent + InitiateCheckout pixel events en `/crear` flow
  - **Por qué**: sin esto Meta optimiza ciego, perdemos plata en ads
  - **Test**: Meta Pixel Helper extension validar 4 eventos
- [x] **C-03** ✅ Loading state que NO se sienta lento (~30s Gemini)
  - **Hipótesis**: user abandona si no ve progreso. Necesita skeleton con micro-mensajes ("Aplicando colores...", "Optimizando para estampa...")
- [x] **C-04** ✅ CTA "Comprar ahora" prominente (no solo "Agregar al carrito")
  - **Hipótesis**: 1-click checkout convierte más que carrito intermedio

### P1 — Importantes (semana 2)

- [x] **C-05** ✅ Mostrar "5 personas vieron este diseño en las últimas 24h" (social proof falso pero etico — usar contador real)
- [x] **C-06** ✅ Comparativa de precio vs competidores (Printful $X vs Novamente $Y)
- [x] **C-07** ✅ Auto-detect intent de comprar y empujar al checkout
- [x] **C-08** ✅ Cuenta regresiva en checkout: "Comprá ahora y te llega antes del [fecha]"
- [x] **C-09** ✅ Recover abandoned cart: si user deja /crear con mockup, ventana emergente al volver

### P2 — Calidad (semana 3)

- [x] **Q-01** ✅ (cubierto en print-ready prompt) Print-ready prompt cubre todos los casos edge (caligrafía fina, tipografías exóticas)
- [x] **Q-02** ✅ Mockup variations: opcional generar 2da escena cuando primera no convence
- [x] **Q-03** ✅ Selector de tamaño de estampa (R1 pecho chico / R2 pecho completo / R3 espalda completa)
- [x] **Q-04** ✅ Detección de baja calidad: si Gemini devuelve algo malo, retry automático

### P3 — Wow features (semana 4)

- [x] **W-01** ✅ Canvas mode: drag&drop del diseño sobre la prenda (react-konva ya está instalado)
- [ ] **W-02** Try-on AR mobile usando getUserMedia + Gemini composing
- [x] **W-03** ✅ Multi-design: hacer remera + buzo + crop con el mismo diseño en un solo flow

---

## 🧪 Suite de tests

`e2e/crear-cases.spec.ts` — 12 casos cubriendo:
- Generación texto (light/dark/noir styles)
- Iteración (image-to-image edit)
- Orientaciones (vertical/horizontal/cuadrado)
- Upload + 3 acciones (bg remove, foto entera, dibujo)
- Cambio de prenda y color
- Doble estampa (front+back)
- Mobile iPhone

**Próximo**: agregar visual regression con baseline images.

---

## 💸 Cost tracking

Budget: $100/mes = ~2500 imágenes Gemini

| Mes | Spend USD | Imágenes | Sesiones dev | Notas |
|---|---|---|---|---|
| 2026-05 | ~$5 | ~125 | 4 | Inicial — mucho testing |

---

## 🔬 Competitor research

Pendiente investigar:
- [ ] **Printful** — flow de creación, pricing, mockups
- [ ] **Canva** (t-shirts) — UX del editor
- [ ] **MerchOne** — print-on-demand argentino
- [ ] **Custom Ink** — el clásico de US

---

## ❓ Preguntas pendientes al user

(vacío — preguntar solo cuando hay decisión real)

---

## P4 — Polish (semana 5) ✅ todo completado

- [x] **P4-01** ✅ Mobile sticky bottom CTA (barra fija con precio + Buy Now al scrollear)
- [x] **P4-02** ✅ Error states con retry button (no se pierde el prompt al fallar)
- [x] **P4-03** ✅ SEO + Open Graph meta tags en /crear (app/crear/layout.tsx)
- [x] **P4-04** ✅ Templates de inicio rápido (8 estilos: Ukiyo-e, Psicodélico 70s, Gótico, Tipografía, Botánico, Pixel art, Streetwear, Minimalista)
- [x] **P4-05** ✅ Shareable link de mockup (URL params recover/design/g/c/s para que el receptor vea y compre)
- [x] **P4-06** ✅ Onboarding modal first-visit (3 pasos explicados, localStorage gate)

---

## P5 — Hardening & monitoring (semana 6) ✅ completado

- [x] **P5-01** ✅ Daily cron health-check (RemoteTrigger) — chequea `/crear`, `/api/public/social-proof`, `/api/generate-image`, `/api/public/design/mockup-lifestyle` y alerta a Telegram si algo falla
- [x] **P5-02** ✅ Pricing breakdown disclosure (`<details>`) — usuario ve cómo se compone el precio (prenda 65% / estampa 25% / margen 10%)
- [x] **P5-03** ✅ A11y baseline — `aria-current`, `aria-label` en clip attach, focus-visible rings en tabs
- [x] **P5-04** ✅ Regression e2e suite (`e2e/conversion-flow.spec.ts`) — desktop + iPhone mobile cubre todo el funnel hasta /checkout

---

## P6 — Conversion micro-levers (semana 7) ✅ completado

- [x] **P6-01** ✅ "Probar otra variante" — botón que regenera el mismo concepto con nudge aleatorio (3 variantes). Captura users que casi gustan el resultado pero quieren probar otra interpretación.
- [x] **P6-02** ✅ `router.prefetch("/checkout")` cuando hay mockup listo → reduce perceived latency en el Buy Now click.
- [x] **P6-03** ✅ Email capture suave: si user idlea 90s con mockup listo, modal "¿Te guardo el diseño?" → POST `/api/public/save-design` → Telegram OPS para follow-up manual.

