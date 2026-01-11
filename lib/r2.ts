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

  // 3. NO usar fallback automático a pub-<id>.r2.dev ya que requiere activación manual en CF dashboard
  // y suele fallar con 401 si no está configurado correctamente.
  // Devolver vacío para forzar el uso del proxy local /api/proxy-image
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

    // 0. Si ya es /api/r2-public?key=... o /api/proxy-image?key=..., extraer el key del parámetro
    // HACER ESTO PRIMERO para evitar que sea tratado como una URL genérica y devuelva "/api/proxy-image"
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

    // 1. Si es URL HTTP(S), extraer el pathname y limpiar
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

    // Remover prefijos de bucket conocidos (solo si estamos seguros que son parte del dominio y no de la ruta)
    const bucketsToRemove = ['novamente', 'novamente-images']
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

  // 0. Si ya tiene el proxy o el public-r2 local, normalizar para asegurar formato limpio
  if (maybeKeyOrUrl.includes('/api/proxy-image') || maybeKeyOrUrl.includes('/api/r2-public')) {
    const key = normalizeR2Key(maybeKeyOrUrl)
    if (!key) return maybeKeyOrUrl

    // Ver si ahora tenemos una base pública real (ej: cdn.novamente.ar)
    const base = getPublicBase()
    if (base) return `${base}/${key.replace(/^\/+/, '')}`

    // Si no, reconstruir el proxy para asegurar que sea el endpoint correcto
    return `/api/proxy-image?key=${encodeURIComponent(key)}`
  }

  // 1. Data URI: devolver tal cual
  if (maybeKeyOrUrl.startsWith('data:')) {
    return maybeKeyOrUrl
  }

  // 2. Normalizar cualquier otra cadena/URL
  const normalized = normalizeR2Key(maybeKeyOrUrl)
  if (!normalized) return maybeKeyOrUrl

  // 3. Intentar obtener URL pública directa
  const base = getPublicBase()
  if (base) {
    return `${base}/${normalized.replace(/^\/+/, '')}`
  }

  // 4. Fallback final: USAR PROXY LOCAL
  // (Esto evita el 401 Unauthorized de r2.dev cuando no está habilitado)
  return `/api/proxy-image?key=${encodeURIComponent(normalized)}`
}


