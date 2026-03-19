# Chatbot Integration Audit

**Fecha:** 2026-03-13
**Repo:** whatsapp-sales-bot + novamente-platform
**Pregunta central:** ¿El chatbot sirve para Partners OS? ¿Conviene integrarlo o dejarlo aparte?

---

## 1. ¿Qué hace el chatbot hoy?

### Funciones actuales

| Función | Estado | Detalle |
|---------|--------|--------|
| Venta B2B | Funcional | Qualify → Design → Mockup → Quote → Close |
| Venta B2C (retail) | Funcional | Payment link directo con precio B2C |
| Generación de diseño | Funcional | Vía platform bridge (NB2) |
| Generación de mockup | Funcional | Vía platform bridge (3-image workflow) |
| Transcripción de audio | Funcional | Gemini 2.0-Flash multimodal |
| Recepción de logos | Funcional | Download media → R2 → customer_assets |
| Order extraction | Funcional | Gemini parsea items de conversación |
| Payment link | Funcional | MercadoPago vía platform bridge |
| Handoff a humano | Funcional | Flag manual_control, Telegram reminder |
| Dashboard admin | Funcional | Pools de conversaciones, chat view, manual controls |

### Canal

- **WhatsApp ONLY** (Meta Cloud API v22.0)
- 1 número de teléfono (`META_PHONE_ID`)
- Webhook en `/api/webhooks/whatsapp`

### Motor

- **SACE v2** (State And Conversation Engine)
- 8 estados: GREETING → QUALIFY → DESIGN_GEN → MOCKUP_CONFIG → MOCKUP_GEN → QUOTE → CLOSING → HUMAN_HANDOFF
- Gemini 2.0-Flash con JSON schema para acciones determinísticas
- Debounce 10s + dedup por wa_id
- Slot extraction (product_key, color, quantity, customer_name, etc.)

---

## 2. ¿Qué canales toca?

| Canal | Dirección | Uso |
|-------|-----------|-----|
| WhatsApp (Meta Cloud API) | Bidireccional | Conversación con clientes |
| Telegram | Saliente only | Notificaciones al equipo Novamente |
| novamente-platform (HTTP) | Saliente | Design/mockup generation, checkout |
| Supabase | Read/Write | Sessions, messages, orders, assets |
| R2 (Cloudflare) | Write | Upload de media (imágenes, audio) |

**No toca:** Email, Instagram DM, web chat, SMS.

---

## 3. ¿Sirve para onboarding de partners?

### Respuesta: PARCIALMENTE, pero no es prioritario para MVP

#### A favor

| Punto | Detalle |
|-------|--------|
| Ya recibe media | Puede recibir logos, banners por WhatsApp |
| Ya transcribe audio | Partner podría describir su marca por audio |
| SACE es extensible | Se puede crear un nuevo playbook "PARTNER_ONBOARDING" |
| Platform bridge ya existe | Puede llamar APIs de creación de tenant |
| Slot extraction | Podría extraer: nombre_marca, rubro, colores, etc. |

#### En contra

| Punto | Detalle |
|-------|--------|
| WhatsApp es limitado para forms | No tiene select, dropdown, multi-step como web |
| Upload de assets es difícil | No puede subir CSV, múltiples imágenes organizadas |
| Branding config necesita UI rica | Selector de colores, preview, drag & drop — imposible en chat |
| El wizard web es mucho mejor UX | 7 pasos guiados con validación, preview, progreso |
| Complejidad innecesaria | Mantener 2 flujos de onboarding (web + WhatsApp) duplica esfuerzo |

#### Veredicto

**No usar el chatbot para onboarding en Fase 1.** El wizard web es superior. Pero sí considerar un asistente WhatsApp de soporte post-onboarding (Fase 3+):
- "¿Cómo cargo un producto?"
- "¿Por qué mi storefront no se ve?"
- "¿Cómo cambio mi logo?"

---

## 4. ¿Sirve para soporte comercial de partners?

### Respuesta: SI, pero necesita tenantización

#### Caso de uso ideal

Un partner activo le escribe al bot por WhatsApp:
- "Quiero ver mis últimos pedidos"
- "¿Cuántos leads tengo esta semana?"
- "Necesito ayuda con mi catálogo"
- "Quiero subir un nuevo producto"

#### Qué se necesita

1. **Resolver tenant por teléfono:** Lookup `tenant_users` donde user tiene phone verificado
2. **Nuevo playbook SACE:** `PARTNER_SUPPORT` con estados específicos
3. **Nuevas acciones:** `SHOW_PARTNER_ORDERS`, `SHOW_PARTNER_LEADS`, `SHOW_PARTNER_STATUS`
4. **Data isolation:** Queries filtradas por tenant_id del partner

#### Esfuerzo: ALTO (2-3 semanas)

No prioritario. El workspace web cubre esto mejor.

---

## 5. ¿Puede actuar por tenant?

### Respuesta: NO actualmente, pero es posible

#### Cambios necesarios

| Cambio | Complejidad | Descripción |
|--------|------------|-------------|
| Lookup tenant por phone | Baja | Buscar en `tenant_users` + `auth.users` → tenant_id |
| Config dinámica | Media | Cargar playbook, productos, precios desde DB por tenant |
| System prompt dinámico | Media | Inyectar nombre de marca, tono, restricciones del partner |
| Múltiples WhatsApp numbers | Alta | Cada partner con su propio número → routing en webhook |
| Notification routing | Media | Telegram/email al partner correcto |
| Payment isolation | Media | MP preference con descriptor del partner |

#### Arquitectura multi-tenant del bot

```
Webhook recibe mensaje
  → Resolver phone_id → ¿qué tenant?
  → Si es Novamente → playbook actual
  → Si es Partner X → cargar config de Partner X
  → Inyectar: system prompt, catálogo, precios, branding
  → Procesar con SACE usando config dinámica
  → Responder en nombre del partner
```

**Problema mayor:** Cada partner necesitaría su propio número de WhatsApp Business API, lo cual implica:
- Cada partner configura su Meta Business Account
- O Novamente opera como BSP (Business Solution Provider) — compliance complejo

**Recomendación:** Dejar bot multi-tenant para Fase 4+. En MVP, el bot sigue siendo solo de Novamente.

---

## 6. ¿Puede leer contexto del partner?

### Respuesta: NO actualmente

El bot no tiene concepto de "partner". Todo es conversación directa con el cliente final, y Novamente es siempre el seller.

#### Para que lea contexto del partner se necesita

1. Tabla `tenant_bot_config`:
   ```sql
   CREATE TABLE tenant_bot_config (
     tenant_id UUID PRIMARY KEY REFERENCES tenants(id),
     whatsapp_phone_id TEXT,          -- Meta phone ID del partner
     system_prompt_override TEXT,      -- Personalización del prompt
     brand_name TEXT,
     brand_tone TEXT,                  -- 'formal', 'casual', 'técnico'
     greeting_message TEXT,
     farewell_message TEXT,
     catalog_source TEXT DEFAULT 'db', -- 'db' | 'json' | 'api'
     supported_actions JSONB,          -- acciones habilitadas
     notification_channels JSONB,      -- {telegram_chat_id, email}
     enabled BOOLEAN DEFAULT FALSE,
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. Modificar webhook para cargar config por phone_id

3. Modificar agent prompt para usar brand_name, tone, restricciones del partner

---

## 7. ¿Puede recomendar ajustes al partner?

### Respuesta: NO actualmente, pero el learning system tiene base

El sistema de learning (`lib/learning/`) ya puede:
- Analizar conversaciones con Gemini
- Identificar qué funcionó y qué no
- Guardar ejemplos exitosos por industria

**Extensión para partners:**
- Analizar conversaciones del partner → sugerir mejoras en catálogo, pricing, diseños
- "Tu producto más consultado es X pero no tiene descripción completa"
- "3 clientes preguntaron por envío y no tenés política de envío configurada"

**Esfuerzo:** Medio (1 semana), pero requiere catálogo en DB primero.

---

## 8. ¿Puede capturar preguntas de onboarding?

### Respuesta: SI, como asistente de soporte

Flujo posible (post-MVP):
1. Partner recién onboardeado recibe WhatsApp de bienvenida
2. Bot actúa como asistente con playbook `PARTNER_HELP`
3. Acciones disponibles:
   - `ANSWER_FAQ` → responde preguntas comunes
   - `GUIDE_CATALOG` → guía para cargar productos
   - `GUIDE_BRANDING` → guía para configurar branding
   - `ESCALATE_HUMAN` → escala a equipo Novamente
4. Las preguntas no respondidas se loguean como feedback para mejorar docs

---

## 9. ¿Puede escalar a humano?

### Respuesta: SI, ya tiene esta funcionalidad

- Flag `manual_control` en `sace_sessions`
- Cuando se activa, bot deja de responder
- Mensajes se muestran en dashboard para intervención humana
- Telegram reminder al equipo
- El humano responde desde dashboard

**Para Partners OS:** Este mismo mecanismo sirve. El admin de Novamente puede tomar control cuando un partner necesita ayuda avanzada.

---

## 10. Decisión: ¿Integrar o dejar aparte?

### Recomendación: DEJAR APARTE en MVP, INTEGRAR GRADUALMENTE

#### Fase 1-3 (MVP): Bot NO toca Partners OS

- El bot sigue operando exclusivamente para Novamente
- Partners OS opera solo por web (workspace, storefront)
- No hay dependencia cruzada
- Simplifica enormemente el MVP

#### Fase 4: Integración liviana

- Notificaciones WhatsApp a partners cuando reciben leads/pedidos
- Bot puede responder FAQs del partner si el partner comparte su número
- Asistente de soporte post-onboarding

#### Fase 5+: Bot multi-tenant (si hay demanda)

- Cada partner con su propio número (o compartido con routing)
- Config dinámica por tenant
- Catálogo y pricing por tenant
- System prompt personalizado
- Dashboard del bot accesible por partner (solo sus conversaciones)

---

## 11. Resumen de capacidades

| Capacidad | Hoy | Con Partners OS (futuro) |
|-----------|-----|--------------------------|
| Venta B2B/B2C | SI (Novamente only) | SI (por partner) |
| Generación de diseño | SI | SI (con branding partner) |
| Generación de mockup | SI | SI (con prendas partner) |
| Onboarding de partners | NO | Parcial (soporte post-onboarding) |
| Soporte comercial | NO | SI (con tenant context) |
| Captación de partners | NO | Posible (bot en landing) |
| Multi-tenant | NO | Requiere refactor significativo |
| Multi-channel | NO (WhatsApp only) | WhatsApp + potencial web chat |
| Escalación a humano | SI | SI |
| Analytics por partner | NO | SI (con tenant isolation) |

---

## 12. Riesgos de integración temprana

| Riesgo | Probabilidad | Impacto |
|--------|-------------|---------|
| Complejidad del MVP se duplica | Alta | Alto |
| Bugs en routing multi-tenant del bot | Media | Alto |
| Cada partner necesita WhatsApp Business API | Alta | Alto (costo + compliance) |
| System prompts mal parametrizados degradan calidad | Media | Medio |
| Mantener 2 playbooks (Novamente + partner) | Media | Medio |

**Conclusión:** Integrar el bot temprano agrega riesgo y complejidad sin beneficio proporcional. Mejor dejarlo aparte y conectar cuando Partners OS esté estable (Fase 4+).
