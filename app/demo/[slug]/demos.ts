// Datos de las demos publicas del asistente de IA de Novamente.
// Extraido de page.tsx (client component) para poder reusarlo tambien
// desde layout.tsx (server component) al generar metadata/OG tags.
export const DEMO_INFO: Record<string, { name: string; icon: string; color: string; suggestions: string[] }> = {
  'demo-restaurante': {
    name: 'La Parrilla de Don Carlos',
    icon: '🍽️',
    color: '#DC2626',
    suggestions: [
      'Que tienen para comer?',
      'Hacen delivery?',
      'Quiero un asado para 2',
      'Tienen opciones vegetarianas?',
    ],
  },
  'demo-clinica': {
    name: 'Centro Medico Vida Sana',
    icon: '🏥',
    color: '#0891B2',
    suggestions: [
      'Necesito un turno con dermatologo',
      'Atienden OSDE?',
      'Cual es el horario de atencion?',
      'Cuanto sale una consulta?',
    ],
  },
  'demo-inmobiliaria': {
    name: 'Propiedades del Sur',
    icon: '🏠',
    color: '#7C3AED',
    suggestions: [
      'Busco un 2 ambientes en Palermo',
      'Que alquileres tienen?',
      'Hacen tasaciones?',
      'Puedo visitar el depto de Belgrano?',
    ],
  },
  'demo-mayorista': {
    name: 'TextilPro Mayorista',
    icon: '📦',
    color: '#EA580C',
    suggestions: [
      'Pasame la lista de precios',
      'Cual es el minimo de compra?',
      'Necesito 50 remeras basicas',
      'Hacen estampado personalizado?',
    ],
  },
  'demo-peluqueria': {
    name: 'Studio Bella',
    icon: '💇',
    color: '#DB2777',
    suggestions: [
      'Cuanto sale un corte de mujer?',
      'Tienen turno para mechas el sabado?',
      'Hacen alisado de keratina?',
      'Atienden sin turno?',
    ],
  },
}
