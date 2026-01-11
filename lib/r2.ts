// Utilidades para normalizar claves/URLs de R2 y generar URL pública final

function getPublicBase(): string {
  // 1. Priorizar NEXT_PUBLIC_R2_PUBLIC_BASE (si existe)
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE
  if (base) {
    return base.replace(/\/$/, "")
  }

  // 2. Usar CLOUDFLARE_R2_PUBLIC_DOMAIN (nuevo ID)
  const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN
  if (publicDomain) {
    const formattedDomain = publicDomain.startsWith('http') ? publicDomain : `https://${publicDomain}`
    return formattedDomain.replace(/\/$/, "")
  }

  // 3. Fallback: Extraer del endpoint (ej: https://<id>.r2.cloudflarestorage.com)
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'novamente'

  if (endpoint) {
    // Buscar el ID de cuenta entre 'https://' y '.r2.cloudflarestorage.com'
    const accountIdMatch = endpoint.match(/https?:\/\/([^.]+)\.r2\.cloudflarestorage\.com/)
    if (accountIdMatch && accountIdMatch[1]) {
      const accountId = accountIdMatch[1]
      return `https://pub-${accountId}.r2.dev/${bucket}`
    }
  }

  console.error('❌ Could not determine R2 public base URL')
  return ''
}

export function normalizeR2Key(maybeKeyOrUrl: string): string {
  try {
    if (!maybeKeyOrUrl) return ''

    // Limpiar espacios al inicio y final
    let cleaned = maybeKeyOrUrl.trim()
    if (!cleaned) return ''

    // FIX: Normalizar espacios alrededor de barras (ej: "images / id" -> "images/id")
    cleaned = cleaned.replace(/\s*\/\s*/g, '/')

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

    // FIX: Detectar patrón de Supabase Storage incluso si no es una URL completa
    // (A veces llega solo el path relativo)
    if (cleaned.includes('/storage/v1/object/public/') || cleaned.startsWith('storage/v1/object/public/')) {
      try {
        const parts = cleaned.split('/public/')
        if (parts.length > 1) {
          // El formato es bucket/.../key. Ej: images/v1/designs/uuid.png
          let key = parts[1].split('?')[0]
          // Remover el nombre del bucket si está al inicio
          const bucketMatch = key.match(/^([^\/]+)\//)
          if (bucketMatch) {
            const bucketName = bucketMatch[1]
            key = key.replace(new RegExp(`^${bucketName}\/`), '')
          }
          return key.replace(/^\/+/, '')
        }
      } catch (e: any) {
        console.warn('⚠️ Error parsing Supabase path in normalizeR2Key:', e.message)
      }
    }

    // Si es URL de Supabase Storage (dominio explícito), extraer el key
    if (cleaned.includes('supabase.co/storage/v1/object/public/')) {
      try {
        const parts = cleaned.split('/public/')
        if (parts.length > 1) {
          // El formato es bucket/.../key. Ej: images/v1/designs/uuid.png
          let key = parts[1].split('?')[0]
          // Remover el nombre del bucket si está al inicio
          const bucketMatch = key.match(/^([^\/]+)\//)
          if (bucketMatch) {
            const bucketName = bucketMatch[1]
            key = key.replace(new RegExp(`^${bucketName}\/`), '')
          }
          return key.replace(/^\/+/, '')
        }
      } catch (e: any) {
        console.warn('⚠️ Error parsing Supabase URL in normalizeR2Key:', e.message)
      }
    }

    // Si es /api/r2-public?key=... o /api/proxy-image?key=..., extraer el key del parámetro
    if (cleaned.includes('/api/r2-public') || cleaned.includes('/api/proxy-image')) {
      try {
        const searchPart = cleaned.split('?')[1]
        if (searchPart) {
          const params = new URLSearchParams(searchPart)
          const rawKey = params.get('key') || ''
          if (rawKey) {
            // Decodificar y limpiar
            let decoded = rawKey
            // Solo decodificar si parece estar codificado (evitar doble decodificación)
            if (rawKey.includes('%')) {
              try { decoded = decodeURIComponent(rawKey); } catch { }
            }
            return decoded.split('?')[0].split('#')[0].replace(/^\/+/, '')
          }
        }
      } catch {
        // Si falla, continuar con el proceso normal
      }
    }

    // Para cualquier otra cadena, limpiar:
    // ... rest of the existing logic ...
    let result = cleaned.split('?')[0].split('#')[0].replace(/^\/+/, '')

    // Intentar decodificar si parece estar codificado
    try {
      if (result.includes('%')) {
        result = decodeURIComponent(result)
        result = result.split('?')[0].split('#')[0].replace(/^\/+/, '')
      }
    } catch {
      // Usar valor original si falla decodificación
    }

    // FIX: Normalizar espacios alrededor de barras nuevamente después de decodificar
    result = result.trim().replace(/\s*\/\s*/g, '/')

    // Normalización final de caracteres problemáticos
    // NO reemplazar espacios si ya es un key limpio que puede tener guiones
    // result = result.replace(/\s+/g, '-').replace(/%20/g, '-')

    // Remover prefijos de bucket conocidos (recursivamente por si hay duplicados como images/images/)
    const bucketsToRemove = ['novamente', 'novamente-images', 'images', 'generated-images', 'public']
    let modified = true
    while (modified) {
      modified = false
      for (const b of bucketsToRemove) {
        if (result.startsWith(`${b}/`)) {
          result = result.replace(new RegExp(`^${b}\/`), '')
          modified = true
        }
      }
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

export function toPublicR2Url(maybeKeyOrUrl: string | null | undefined): string | null {
  if (!maybeKeyOrUrl) return null

  // 1. Data URI: devolver tal cual
  if (maybeKeyOrUrl.startsWith('data:')) {
    return maybeKeyOrUrl
  }

  // 2. Ya es una URL de proxy: normalizar el key y reconstruir (o devolver directo si R2 es público)
  if (maybeKeyOrUrl.includes('/api/proxy-image') || maybeKeyOrUrl.includes('/api/r2-public')) {
    const key = normalizeR2Key(maybeKeyOrUrl)
    if (key) {
      // Intentar obtener la URL pública directa primero
      const publicUrl = getPublicR2Url(key)
      return publicUrl || `/api/proxy-image?key=${encodeURIComponent(key)}`
    }
  }

  // 3. Normalizar cualquier otra cadena/URL
  const normalized = normalizeR2Key(maybeKeyOrUrl)
  if (!normalized) return maybeKeyOrUrl // Si no se puede normalizar, devolver original

  return getPublicR2Url(normalized) || maybeKeyOrUrl
}


