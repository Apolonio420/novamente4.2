import { VisualizerContainer } from "@/components/CustomVisualizer/VisualizerContainer"

export default function CustomVisualizerPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30">
            <main className="container mx-auto px-4 py-8 pt-24 min-h-[calc(100vh-80px)]">
                <div className="mb-10 text-center space-y-4">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-700">
                        Visualizador Custom
                    </h1>
                    <p className="text-zinc-400 max-w-2xl mx-auto text-lg animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
                        Subí tus propios diseños, remové el fondo con IA y previsualizalos en nuestras prendas premium.
                    </p>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    <VisualizerContainer />
                </div>
            </main>
        </div>
    )
}
