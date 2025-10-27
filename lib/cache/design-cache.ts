import localforage from "localforage"

// Configurar localforage para el namespace de NovaMente
localforage.config({
  name: "novamente",
  storeName: "designs",
  description: "Cache de mockups y diseños generados",
})

export const DesignCache = {
  async get(key: string): Promise<string | null> {
    try {
      return await localforage.getItem<string>(key)
    } catch (error) {
      console.error("Error leyendo caché:", error)
      return null
    }
  },

  async set(key: string, data: string): Promise<void> {
    try {
      await localforage.setItem(key, data)
    } catch (error) {
      console.error("Error guardando en caché:", error)
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await localforage.removeItem(key)
    } catch (error) {
      console.error("Error eliminando de caché:", error)
    }
  },

  async clear(): Promise<void> {
    try {
      await localforage.clear()
    } catch (error) {
      console.error("Error limpiando caché:", error)
    }
  },
}

