import { getGeminiClient } from "@/lib/gemini"

export type Intent = "mockup_request" | "sales_conversation" | "order_finalization" | "human_handoff" | "ignore"

interface RouterOutput {
    intent: Intent
    urgency: number
    reasoning: string
}

const ROUTER_PROMPT = `
Sos el Router Inteligente de NovaMente. Tu único trabajo es analizar el mensaje entrante y decidir qué agente debe responder o qué acción tomar.

CLASIFICACIONES POSIBLES:
1. "mockup_request": El usuario pide explícitamente ver un diseño, manda un logo, o dice "quiero ver cómo queda". Si manda una IMAGEN sin texto, es mockup_request.
2. "sales_conversation": Preguntas de precios, envíos, dudas generales, negociación, o iniciando la conversación ("Hola", "Info").
3. "order_finalization": Intención clara de comprar, pedir link de pago, confirmar pedido.
4. "human_handoff": Quejas, insultos, pedidos muy complejos, o si pide explícitamente hablar con alguien.
5. "ignore": Spam o mensajes vacíos.

OUTPUT (JSON ONLY):
{
  "intent": "intent_name",
  "urgency": 1-5,
  "reasoning": "Breve explicación"
}
`

export async function classifyIntent(message: string, hasImage: boolean = false): Promise<RouterOutput> {
    try {
        const genAI = getGeminiClient()
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        })

        const input = `
    MESSAGE: "${message}"
    HAS_IMAGE: ${hasImage}
    
    Classify the intent based on the rules.
    `

        const result = await model.generateContent([ROUTER_PROMPT, input])
        const response = await result.response
        const text = response.text()

        return JSON.parse(text) as RouterOutput
    } catch (error) {
        console.error("Router Error:", error)
        // Fallback safe intent
        return { intent: "sales_conversation", urgency: 1, reasoning: "Fallback due to error" }
    }
}
