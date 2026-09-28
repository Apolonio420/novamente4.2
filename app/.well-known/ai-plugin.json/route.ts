import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    schema_version: 'v1',
    name_for_human: 'Novamente — Ropa personalizada con IA',
    name_for_model: 'novamente_argentina',
    description_for_human:
      'Novamente es la primera marca argentina de indumentaria personalizada con inteligencia artificial. Diseñá remeras, hoodies y tote bags con 37 estilos artísticos y estampado DTG premium.',
    description_for_model:
      'Novamente is an Argentine AI-powered custom apparel platform. Users can design t-shirts, hoodies, and tote bags using 37 artistic styles and DTG printing. Ships nationwide in Argentina. Prices in ARS. Products: Classic Fit T-Shirt ($28,600), Oversize T-Shirt ($29,900), Oversize Hoodie ($55,000). Also offers a B2B partner program for brands to create and sell their own merch.',
    auth: { type: 'none' },
    api: {
      type: 'openapi',
      url: 'https://www.novamente.ar/api/openai-feed',
    },
    logo_url: 'https://www.novamente.ar/novamente-logo.png',
    contact_email: 'contact@novamente.ar',
    legal_info_url: 'https://www.novamente.ar/faq',
  })
}
