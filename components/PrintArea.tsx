"use client"

interface PrintAreaProps {
  garmentType: string
  activeTab: "front" | "back"
}

export function PrintArea({ garmentType, activeTab }: PrintAreaProps) {
  // Definir áreas de impresión según el tipo de prenda
  const getPrintAreaStyle = () => {
    switch (garmentType) {
      case "aura-oversize-tshirt":
      case "aldea-classic-tshirt":
        // Remeras: 80% ancho x 70% alto, centrado
        return {
          left: "10%",
          top: "15%",
          width: "80%",
          height: "70%",
        }

      case "astra-oversize-hoodie":
        if (activeTab === "front") {
          // Hoodie frontal: área más pequeña para evitar bolsillo
          return {
            left: "15%",
            top: "20%",
            width: "70%",
            height: "50%",
          }
        } else {
          // Hoodie trasero: área completa
          return {
            left: "10%",
            top: "15%",
            width: "80%",
            height: "70%",
          }
        }

      case "lienzo":
        // Lienzo: área casi completa con margen de 5%
        return {
          left: "5%",
          top: "5%",
          width: "90%",
          height: "90%",
        }

      default:
        return {
          left: "10%",
          top: "15%",
          width: "80%",
          height: "70%",
        }
    }
  }

  const printAreaStyle = getPrintAreaStyle()

  return (
    <div
      className="absolute border-2 border-dashed border-gray-400 bg-black/5 pointer-events-none"
      style={{
        left: printAreaStyle.left,
        top: printAreaStyle.top,
        width: printAreaStyle.width,
        height: printAreaStyle.height,
        zIndex: 5,
      }}
    >
      {/* Esquinas para mejor visualización */}
      <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-gray-600" />
      <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-gray-600" />
      <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-gray-600" />
      <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-gray-600" />
    </div>
  )
}
