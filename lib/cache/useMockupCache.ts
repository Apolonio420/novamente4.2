import { useState, useEffect } from "react"
import { DesignCache } from "./design-cache"

export function useMockupCache(key: string) {
  const [url, setUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    let mounted = true

    async function loadCached() {
      const cached = await DesignCache.get(key)
      if (cached && mounted) {
        setUrl(cached)
      }
    }

    loadCached()

    return () => {
      mounted = false
    }
  }, [key])

  const save = async (dataUrl: string) => {
    await DesignCache.set(key, dataUrl)
    setUrl(dataUrl)
  }

  const clear = async () => {
    await DesignCache.remove(key)
    setUrl(undefined)
  }

  return { url, save, clear }
}

