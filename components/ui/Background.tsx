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
          backgroundImage: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mNk+M9Qz0AIBo5gOQ7H/Sw=1JmAAAArSURBVHjYR8NCBQC4oPx8BgUFAKGg/xCGzPs/KP9/jIpMqqoIgAIAAA=)')",
          backgroundRepeat: "repeat",
          backgroundSize: "64px 64px"
        }}
      />
    </div>
  )
}

