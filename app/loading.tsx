export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-zinc-700" />
          <div className="absolute inset-0 rounded-full border-2 border-t-white animate-spin" />
        </div>
        <p className="text-zinc-500 text-sm animate-pulse">Cargando...</p>
      </div>
    </div>
  )
}
