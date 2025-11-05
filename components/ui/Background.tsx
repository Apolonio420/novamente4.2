"use client"

export function Background() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[-1]">
      {/* Gradiente suave */}
      <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(139,92,246,0.14)_0%,rgba(236,72,153,0.10)_30%,transparent_65%)]" />
      {/* Ruido sutil */}
      <div 
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          // Usar un pixel transparente para evitar errores de data URL inválidos
          backgroundImage: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Y4jQAAAAASUVORK5CYII=')",
          backgroundRepeat: "repeat",
          backgroundSize: "64px 64px"
        }}
      />
    </div>
  )
}

