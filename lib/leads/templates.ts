export interface EmailTemplate {
  id: number
  name: string
  subject: string
  body_html: string
  variables_used: string[]
}

export const coldEmailTemplates: EmailTemplate[] = [
  {
    id: 1,
    name: 'Primer Contacto (Conocemos su negocio)',
    subject: '¿Merch copada para {nombre_negocio}?',
    body_html: `<p>Hola {nombre_contacto},</p><p>Estuve viendo lo que hacen en {nombre_negocio} y la verdad es que la onda que tienen en el {rubro} es genial. Se nota la calidad y la pasión.</p><p>Pensando en cómo potenciar esa imagen, me surgió una idea: ¿qué onda si le damos un upgrade a su merch? En Novamente hacemos indumentaria personalizada (remeras, hoodies) con estampado DTG de altísima calidad.</p><p>Podemos crear algo que refleje exactamente la identidad de {nombre_negocio}. Te dejo un par de ejemplos para que veas cómo queda: <a href="{url_mockup_frente}">Frente</a> y <a href="{url_mockup_dorso}">Dorso</a>.</p><p>¿Te gustaría que charlemos un toque sobre cómo armar algo único para ustedes? ¡Dale!</p><p>Saludos,<br/>[Tu Nombre]</p>`,
    variables_used: ['{nombre_negocio}', '{nombre_contacto}', '{rubro}', '{url_mockup_frente}', '{url_mockup_dorso}'],
  },
  {
    id: 2,
    name: 'Primer Contacto Frío',
    subject: 'Merch que realmente represente a {nombre_negocio}',
    body_html: `<p>Hola {nombre_contacto},</p><p>Sé que probablemente recibís un montón de mails, así que voy directo al grano. En Novamente nos especializamos en crear indumentaria personalizada (remeras, hoodies) con estampado DTG, pensada para negocios como el tuyo ({rubro}).</p><p>Muchos negocios terminan con merch genérica que no refleja su calidad. Nosotros te ayudamos a que cada prenda sea una extensión de la marca {nombre_negocio}.</p><p>Che, mirá estos mockups para que te hagas una idea de lo que podemos hacer: <a href="{url_mockup_frente}">Frente</a> y <a href="{url_mockup_dorso}">Dorso</a>.</p><p>Si te interesa darle un toque más profesional y copado a tu mercadería, contame cuándo tenés 10 minutos para una llamada rápida. ¡Un abrazo!</p><p>Saludos,<br/>[Tu Nombre]</p>`,
    variables_used: ['{nombre_negocio}', '{nombre_contacto}', '{rubro}', '{url_mockup_frente}', '{url_mockup_dorso}'],
  },
  {
    id: 3,
    name: 'Follow-up 1 (3 días, no respondieron)',
    subject: 'Re: ¿Merch copada para {nombre_negocio}?',
    body_html: `<p>Hola {nombre_contacto},</p><p>Te escribo de nuevo porque sé que andás a mil con el día a día de {nombre_negocio}. Quizás mi mail anterior se te perdió en el ruido.</p><p>Solo quería recordarte que en Novamente podemos hacer que la merch de tu marca sea un fierro. Ya sea para tu equipo, eventos o venta, la calidad DTG es imbatible.</p><p>Si te sirve de referencia, acá te dejo de nuevo los ejemplos de cómo queda el diseño: <a href="{url_mockup_frente}">Frente</a> y <a href="{url_mockup_dorso}">Dorso</a>.</p><p>Si no es el momento, ¡no pasa nada! Pero si te interesa, avisame y te paso más data. ¡Un abrazo!</p><p>Saludos,<br/>[Tu Nombre]</p>`,
    variables_used: ['{nombre_negocio}', '{nombre_contacto}', '{url_mockup_frente}', '{url_mockup_dorso}'],
  },
  {
    id: 4,
    name: 'Follow-up 2 (7 días, última oportunidad)',
    subject: 'Último toque sobre la merch de {nombre_negocio}',
    body_html: `<p>Hola {nombre_contacto},</p><p>Te escribo por última vez sobre la posibilidad de potenciar la imagen de {nombre_negocio} con nuestra indumentaria personalizada.</p><p>Entiendo que quizás no sea una prioridad ahora, y si es así, ¡no hay ningún problema! Pero si estás buscando elevar el nivel de tu merchandising, Novamente es la solución en DTG.</p><p>Para que no te quedes con la duda, te dejo un link rápido con un ejemplo de cómo podemos hacer que tu marca luzca increíble: <a href="{url_mockup_frente}">Ver diseño</a>.</p><p>Si en algún momento te interesa retomar el tema, acá estoy. Si no, te dejo tranquilo. ¡Mucha suerte con todo!</p><p>Saludos cordiales,<br/>[Tu Nombre]</p>`,
    variables_used: ['{nombre_negocio}', '{nombre_contacto}', '{url_mockup_frente}'],
  },
  {
    id: 5,
    name: 'Propuesta con precios',
    subject: 'Cotización: Merch personalizada para {nombre_negocio}',
    body_html: `<p>Hola {nombre_contacto},</p><p>Gracias por tu interés en Novamente. Como te comenté, hacemos indumentaria DTG de primera para que {nombre_negocio} luzca espectacular.</p><p>Para que empieces a ver la onda, te adjunto una guía rápida de precios y opciones de personalización. Dependiendo del volumen y el diseño, podemos armar algo súper competitivo.</p><p>Te dejo un par de mockups para que te imagines el producto final: <a href="{url_mockup_frente}">Frente</a> y <a href="{url_mockup_dorso}">Dorso</a>.</p><p>¿Qué te parece si coordinamos una llamada corta para definir qué necesitás y te armo una cotización súper ajustada a tu presupuesto? ¡Dale, contame!</p><p>Un abrazo,<br/>[Tu Nombre]</p>`,
    variables_used: ['{nombre_negocio}', '{nombre_contacto}', '{url_mockup_frente}', '{url_mockup_dorso}'],
  },
]

/**
 * Replaces template variables with actual values.
 * @example interpolate(template, { '{nombre_negocio}': 'Acme', '{nombre_contacto}': 'Juan' })
 */
export function interpolate(template: EmailTemplate, vars: Record<string, string>): { subject: string; body_html: string } {
  let subject = template.subject
  let body_html = template.body_html
  for (const [key, value] of Object.entries(vars)) {
    subject = subject.replaceAll(key, value)
    body_html = body_html.replaceAll(key, value)
  }
  return { subject, body_html }
}
