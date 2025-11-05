// Utilidades para normalizar claves/URLs de R2 y generar URL pública final

function getPublicBase(): string {
  // Preferir base pública explícita desde el frontend
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE
  if (base) return base.replace(/\/$/, "")

  // Fallbacks desde variables del backend si se usa en server
  const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN
  if (publicDomain) return `https://${publicDomain}`

  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'novamente-images'
  const accountId = endpoint?.match(/https:\/\/([^.]+)\.r2\.cloudflarestorage\.com/)?.[1]
  if (accountId) return `https://pub-${accountId}.r2.dev/${bucket}`

  // Último recurso: devolver string vacío
  return ''
}

export function normalizeR2Key(maybeKeyOrUrl: string): string {
  try {
    if (!maybeKeyOrUrl) return ''

    // Limpiar espacios al inicio y final
    let cleaned = maybeKeyOrUrl.trim()
    if (!cleaned) return ''

    // Si es URL HTTP(S), extraer el pathname y limpiar
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      try {
        const u = new URL(cleaned)
        // Extraer el key del pathname (puede incluir bucket en algunos casos)
        let key = u.pathname.replace(/^\/+/, '')
        
        // Si el hostname es r2.dev o cloudflarestorage.com, el pathname puede tener formato:
        // /bucket/key o solo /key
        // Intentar extraer solo la parte del key
        const pathParts = key.split('/')
        if (pathParts.length > 1 && pathParts[0] === 'novamente-images') {
          // Si el primer segmento es el bucket, removerlo
          key = pathParts.slice(1).join('/')
        }
        
        // Eliminar query params y fragments
        return key.split('?')[0].split('#')[0].replace(/^\/+/, '')
      } catch {
        // Si falla parsear URL, continuar con el proceso normal
      }
    }

    // Si es /api/r2-public?key=..., extraer el key del parámetro
    if (cleaned.startsWith('/api/r2-public')) {
      try {
        const u = new URL(cleaned, 'http://local')
        const rawKey = u.searchParams.get('key') || ''
        // Decodificar y limpiar
        const decoded = decodeURIComponent(rawKey)
        // Eliminar query params y fragmentos que puedan estar dentro del key
        return decoded.split('?')[0].split('#')[0].replace(/^\/+/, '')
      } catch {
        // Si falla, continuar con el proceso normal
      }
    }

    // Para cualquier otra cadena, limpiar:
    // - Eliminar query params (?)
    // - Eliminar fragmentos (#)
    // - Eliminar barras al inicio
    // - Decodificar si está codificado
    let result = cleaned.split('?')[0].split('#')[0].replace(/^\/+/, '')
    
    // Intentar decodificar si parece estar codificado
    try {
      // Solo decodificar si tiene caracteres codificados típicos
      if (result.includes('%')) {
        result = decodeURIComponent(result)
        // Limpiar nuevamente después de decodificar
        result = result.split('?')[0].split('#')[0].replace(/^\/+/, '')
      }
    } catch {
      // Si falla la decodificación, usar el valor original
    }
    
    // Remover prefijo "novamente/" si existe (las claves en R2 no incluyen el bucket en el key)
    if (result.startsWith('novamente/')) {
      result = result.replace(/^novamente\//, '')
    }
    // También remover "novamente-images/" si existe (nombre del bucket)
    if (result.startsWith('novamente-images/')) {
      result = result.replace(/^novamente-images\//, '')
    }
    
    return result
  } catch {
    return ''
  }
}

export function getPublicR2Url(objectKey: string): string {
  if (!objectKey) return ''
  const key = normalizeR2Key(objectKey)
  if (!key) return ''
  
  const base = getPublicBase()
  if (!base) return ''
  
  // Asegurar que el key no tenga barras al inicio
  const cleanKey = key.replace(/^\/+/, '')
  return `${base}/${cleanKey}`
}

export function toPublicR2Url(maybeKeyOrUrl: string): string {
  if (!maybeKeyOrUrl) return ''
  // Si ya es una URL HTTP completa y válida, verificar si es de nuestro dominio R2
  if (maybeKeyOrUrl.startsWith('http://') || maybeKeyOrUrl.startsWith('https://')) {
    const normalized = normalizeR2Key(maybeKeyOrUrl)
    if (normalized) {
      return getPublicR2Url(normalized)
    }
  }
  return getPublicR2Url(maybeKeyOrUrl)
}


