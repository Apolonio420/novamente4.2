/**
 * Parser de pedidos en texto libre → ítems estructurados (cara al partner).
 *
 * Portado desde novamente-platform-master/lib/orders/parse-with-ai.ts. Recibe
 * lo que el partner pega de un chat (WhatsApp/Instagram, voz a texto, etc.) y
 * devuelve items estructurados (producto canónico, color, talle, cantidad,
 * doble_estampa, fuente, envio, comments) + el nombre del cliente.
 *
 * NO cotiza ni toca precios — solo estructura el texto para que el partner lo
 * revise/edite antes de cargar el pedido. Precios (PVP / precio partner) los
 * completa el partner en el form.
 *
 * Catálogo: CANONICAL_PRODUCTS de product-aliases.ts. Modelo: Gemini 2.5 Flash
 * (GEMINI_API_KEY — ya configurada en este repo).
 */
import { CANONICAL_PRODUCTS } from "./product-aliases";

export const CANONICAL_COLORS = [
  "STONE WASH",
  "VISON",
  "CREMA",
  "BLANCO",
  "NEGRO",
  "GRIS",
  "AMARILLO",
  "ROSA",
  "CELESTE",
  "AZUL",
  "ROJO",
  "VERDE",
  "MARRON",
  "CARAMELO",
] as const;

const VALID_SIZES = [
  "XS", "S", "M", "L", "XL", "XXL", "XXXL",
  "2", "4", "6", "8", "10", "12", "14", "16",
] as const;

const VALID_ENVIOS = [
  "Envio Mensajeria",
  "Envio Andreani - Ver etiqueta adjunta",
  "Envio a Confirmar",
] as const;

export type ParsedItem = {
  producto: string;       // canonical product name
  color: string;          // canonical color (uppercase)
  talle: string;          // size token (uppercase)
  cantidad: number;       // integer >= 1
  doble_estampa: "Si" | "No" | "Chica";
  fuente?: string;        // free text (Instagram, WhatsApp, etc.)
  envio?: typeof VALID_ENVIOS[number];
  comments?: string;      // detalles libres del item (posición/tamaño estampa, etc.)
};

export type ParseResult = {
  items: ParsedItem[];
  warnings: string[];     // campos no inferidos, ambigüedades
  confidence: number;     // 0..1 — confianza global del parseo
  raw_notes: string;      // notas globales (lo que no entró en items)
  cliente?: string;       // nombre del cliente si se menciona
};

const PROMPT_TEMPLATE = (text: string) => `Sos un asistente que convierte pedidos de indumentaria escritos en texto libre (chats de WhatsApp/Instagram, voz pasada a texto, etc.) a JSON estructurado para una orden de producción de la marca Novamente.

CATÁLOGO DE PRODUCTOS (usá EXACTAMENTE estos nombres):
${CANONICAL_PRODUCTS.map(p => `- ${p}`).join("\n")}

COLORES VÁLIDOS (en MAYÚSCULAS, sin tildes):
${CANONICAL_COLORS.join(", ")}

TALLES VÁLIDOS:
${VALID_SIZES.join(", ")}

OPCIONES DE ENVÍO (si el partner menciona, matcheá una de estas):
${VALID_ENVIOS.map(e => `- "${e}"`).join("\n")}

REGLAS:
1. Si el texto menciona varios productos distintos, generá un item por cada uno.
2. Si la cantidad no se aclara, asumí 1.
3. "Doble estampa" / "estampa adelante y atrás" / "frente y espalda" → doble_estampa: "Si". "Estampa chica" / "estampita" / "estampa pequeña" / "logo chico" → doble_estampa: "Chica". Default: "No".
4. Si el color no matchea exactamente uno del catálogo, elegí el más cercano (ej. "off white" → "CREMA", "vino" → "ROJO", "navy" → "AZUL"). Si no podés inferir, dejá string vacío y agregá warning.
5. Si el talle no se especifica, dejá string vacío y agregá warning "Línea X: falta talle".
6. Detalles de la estampa (dónde va, tamaño en cm, posición, técnica, número de tinta, etc.) van al campo "comments" del item.
7. La "fuente" es el canal por donde llegó el pedido (Instagram, WhatsApp, mail, presencial, etc.). Si no se menciona, dejá string vacío.
8. raw_notes: notas globales que NO pertenecen a un item específico (dirección de envío, datos del cliente, comentarios generales, descuentos, etc.).
9. confidence: 0.9+ si todo quedó claro y matcheado, 0.6-0.8 si tuviste que inferir cosas, <0.5 si hay mucha ambigüedad.
10. Si el texto menciona el nombre del cliente (ej. "Pedido para Juan Pérez", "es para María", "cliente: Pablo García", "lo pidió Sofía"), extraerlo al campo "cliente". Si no se menciona, dejar string vacío.
11. NO inventes ni infieras precios. No incluyas ningún campo de precio en el JSON.

TEXTO DEL PARTNER:
"""
${text}
"""

Respondé ÚNICAMENTE con un JSON válido (sin markdown, sin backticks, sin texto adicional) con esta forma exacta:
{
  "items": [
    {
      "producto": "string (uno del catálogo)",
      "color": "string (uno de los colores válidos en MAYÚSCULAS, o '' si no se pudo inferir)",
      "talle": "string (uno de los talles válidos, o '' si no se pudo inferir)",
      "cantidad": number,
      "doble_estampa": "Si" | "No" | "Chica",
      "fuente": "string (opcional)",
      "envio": "string (opcional, una de las 3 opciones de envío)",
      "comments": "string (opcional, detalles de la estampa para este item)"
    }
  ],
  "warnings": ["string"],
  "confidence": 0.0-1.0,
  "raw_notes": "string (notas globales del pedido)",
  "cliente": "string (nombre del cliente si se menciona, o '' si no)"
}`;

export async function parseOrderText(text: string): Promise<ParseResult> {
  if (!text || !text.trim()) {
    return {
      items: [],
      warnings: ["Texto vacío"],
      confidence: 0,
      raw_notes: "",
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada");
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT_TEMPLATE(text) }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048, responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(20_000),
    }
  );

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Gemini HTTP ${res.status}: ${errBody.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = String(raw).replace(/```json\s*/g, "").replace(/```/g, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Gemini devolvió JSON inválido");
  }

  return normalizeResult(parsed);
}

function normalizeResult(raw: unknown): ParseResult {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const itemsRaw = Array.isArray(obj.items) ? obj.items : [];
  const warnings = Array.isArray(obj.warnings) ? obj.warnings.map(String) : [];

  const items: ParsedItem[] = [];
  for (let i = 0; i < itemsRaw.length; i++) {
    const it = (itemsRaw[i] && typeof itemsRaw[i] === "object" ? itemsRaw[i] : {}) as Record<string, unknown>;
    const cant = Number(it.cantidad);
    const doble = it.doble_estampa;
    const envio = typeof it.envio === "string" ? it.envio.trim() : "";

    const item: ParsedItem = {
      producto: String(it.producto ?? "").trim(),
      color: String(it.color ?? "").trim().toUpperCase(),
      talle: String(it.talle ?? "").trim().toUpperCase(),
      cantidad: Number.isFinite(cant) && cant > 0 ? Math.floor(cant) : 1,
      doble_estampa: doble === "Si" || doble === true ? "Si" : doble === "Chica" ? "Chica" : "No",
      fuente: typeof it.fuente === "string" ? it.fuente.trim() : undefined,
      envio: VALID_ENVIOS.includes(envio as (typeof VALID_ENVIOS)[number])
        ? (envio as (typeof VALID_ENVIOS)[number])
        : undefined,
      comments: typeof it.comments === "string" ? it.comments.trim() || undefined : undefined,
    };
    items.push(item);
  }

  const conf = Number(obj.confidence);
  const confidence = Number.isFinite(conf) ? Math.min(1, Math.max(0, conf)) : 0.5;
  const raw_notes = typeof obj.raw_notes === "string" ? obj.raw_notes.trim() : "";
  const cliente = typeof obj.cliente === "string" ? obj.cliente.trim() : "";

  return { items, warnings, confidence, raw_notes, cliente };
}
