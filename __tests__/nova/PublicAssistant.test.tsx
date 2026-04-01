import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// --- Mocks (before component import) ---

// Next.js navigation
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: mockPush }),
}))

// Next.js Image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} data-testid={`img-${alt}`} />,
}))

// Cart store
const mockAddItem = vi.fn()
const mockGetTotalItems = vi.fn(() => 0)
vi.mock("@/lib/cartStore", () => ({
  useCart: () => ({
    addItem: mockAddItem,
    getTotalItems: mockGetTotalItems,
  }),
}))

// Assistant auth hook
vi.mock("@/lib/hooks/useAssistantAuth", () => ({
  useAssistantAuth: () => ({
    mode: "visitor" as const,
    loading: false,
  }),
}))

// Page context hook
vi.mock("@/lib/hooks/usePageContext", () => ({
  usePageContext: () => ({
    pathname: "/",
    pageType: "home" as const,
  }),
}))

// Catalog
vi.mock("@/lib/catalog", () => ({
  PRODUCTS: [
    { name: "Aura Oversize", garmentType: "aura-oversize-tshirt", price: 31000, colors: ["negro", "blanco"], image: "/products/oversize-negro-front.jpeg", category: "remera" },
    { name: "Hoodie Unisex", garmentType: "buzo-hoodie-unisex", price: 55000, colors: ["negro"], image: "/products/hoodie-negro-front.jpeg", category: "hoodie" },
  ],
  formatPrice: (n: number) => `$${n.toLocaleString("es-AR")}`,
}))

import { PublicAssistant } from "@/components/PublicAssistant"

// --- Helpers ---

function createSSEResponse(events: Array<{ type: string; text?: string; sources?: any[] }>) {
  const body = events.map(e => `data: ${JSON.stringify(e)}`).join("\n") + "\n"
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(body))
      controller.close()
    },
  })
  return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } })
}

function renderAssistant() {
  return render(<PublicAssistant />)
}

async function openChat() {
  const fab = screen.getByLabelText("Abrir asistente Nova")
  await userEvent.click(fab)
}

// --- Setup ---

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
  vi.stubGlobal("fetch", vi.fn())
  vi.stubGlobal("URL", { ...globalThis.URL, createObjectURL: vi.fn(() => "blob:test"), revokeObjectURL: vi.fn() })
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ========== A) Rendering Tests ==========

describe("A) Rendering", () => {
  it("renders FAB button with Nova branding", () => {
    renderAssistant()
    const fab = screen.getByLabelText("Abrir asistente Nova")
    expect(fab).toBeInTheDocument()
    expect(screen.getByTestId("img-Nova")).toBeInTheDocument()
  })

  it("click FAB opens chat panel", async () => {
    renderAssistant()
    await openChat()
    expect(screen.getByText("¡Hola! Soy Nova")).toBeInTheDocument()
    expect(screen.getByText("Asistente IA")).toBeInTheDocument()
  })

  it("chat panel has input field and send button", async () => {
    renderAssistant()
    await openChat()
    expect(screen.getByPlaceholderText("Escribí tu mensaje...")).toBeInTheDocument()
    // Send button exists (disabled when input empty)
    const sendBtn = screen.getAllByRole("button").find(b => b.classList.contains("bg-purple-600") || b.classList.contains("disabled:bg-zinc-700"))
    expect(sendBtn).toBeTruthy()
  })

  it("welcome message shows on first open", async () => {
    renderAssistant()
    await openChat()
    expect(screen.getByText("¡Hola! Soy Nova")).toBeInTheDocument()
    expect(screen.getByText(/Te ayudo a diseñar tu ropa personalizada/)).toBeInTheDocument()
  })

  it("quick reply suggestions appear on first open", async () => {
    renderAssistant()
    await openChat()
    expect(screen.getByText("Quiero diseñar algo")).toBeInTheDocument()
    expect(screen.getByText("¿Cómo funciona?")).toBeInTheDocument()
    expect(screen.getByText("Ver productos")).toBeInTheDocument()
  })
})

// ========== B) Message Flow Tests ==========

describe("B) Message flow", () => {
  it("user can type and send a message", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      createSSEResponse([{ type: "chunk", text: "Hola, soy Nova!" }])
    )
    renderAssistant()
    await openChat()

    const input = screen.getByPlaceholderText("Escribí tu mensaje...")
    await userEvent.type(input, "Hola")
    fireEvent.keyDown(input, { key: "Enter" })

    await waitFor(() => {
      expect(screen.getByText("Hola")).toBeInTheDocument()
    })
  })

  it("sent message appears as user bubble", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      createSSEResponse([{ type: "chunk", text: "Bienvenido!" }])
    )
    renderAssistant()
    await openChat()

    const input = screen.getByPlaceholderText("Escribí tu mensaje...")
    await userEvent.type(input, "Test message")
    fireEvent.keyDown(input, { key: "Enter" })

    await waitFor(() => {
      const userBubble = screen.getByText("Test message")
      expect(userBubble).toBeInTheDocument()
      // User messages have purple background
      expect(userBubble.closest("div[class*='bg-purple-600']")).toBeTruthy()
    })
  })

  it("loading indicator shows while waiting for response", async () => {
    let resolveStream: () => void
    const streamPromise = new Promise<void>(r => { resolveStream = r })
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        await streamPromise
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "chunk", text: "done" })}\n`))
        controller.close()
      },
    })
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } })
    )

    renderAssistant()
    await openChat()

    const input = screen.getByPlaceholderText("Escribí tu mensaje...")
    await userEvent.type(input, "Hola")
    fireEvent.keyDown(input, { key: "Enter" })

    await waitFor(() => {
      expect(screen.getByText("Pensando...")).toBeInTheDocument()
    })

    // Resolve to clean up
    act(() => resolveStream!())
  })

  it("messages persist to localStorage", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      createSSEResponse([{ type: "chunk", text: "Respuesta guardada" }])
    )
    renderAssistant()
    await openChat()

    const input = screen.getByPlaceholderText("Escribí tu mensaje...")
    await userEvent.type(input, "Persistencia")
    fireEvent.keyDown(input, { key: "Enter" })

    await waitFor(() => {
      expect(screen.getByText("Respuesta guardada")).toBeInTheDocument()
    })

    const stored = localStorage.getItem("novamente-public-assistant")
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!)
    expect(parsed.length).toBeGreaterThanOrEqual(2)
    expect(parsed[0].text).toBe("Persistencia")
  })
})

// ========== C) Action Execution Tests ==========

describe("C) Action execution", () => {
  it("SHOW_STYLES renders style grid", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      createSSEResponse([{ type: "chunk", text: "Acá van los estilos [ACTION:SHOW_STYLES]" }])
    )
    renderAssistant()
    await openChat()

    const input = screen.getByPlaceholderText("Escribí tu mensaje...")
    await userEvent.type(input, "Mostrame estilos")
    fireEvent.keyDown(input, { key: "Enter" })

    await waitFor(() => {
      expect(screen.getByText("37 estilos disponibles:")).toBeInTheDocument()
    })
  })

  it("GENERATE_DESIGN shows loading state", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      createSSEResponse([{ type: "chunk", text: "[ACTION:GENERATE_DESIGN] a cool dragon" }])
    )
    // generate-image endpoint (delayed)
    let resolveGenerate: (value: globalThis.Response) => void
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(r => { resolveGenerate = r }))

    renderAssistant()
    await openChat()

    const input = screen.getByPlaceholderText("Escribí tu mensaje...")
    await userEvent.type(input, "Diseñame un dragon")
    fireEvent.keyDown(input, { key: "Enter" })

    await waitFor(() => {
      expect(screen.getByText("Generando diseño...")).toBeInTheDocument()
    })

    act(() => {
      resolveGenerate!(new Response(JSON.stringify({ success: true, images: [{ url: "https://example.com/design.png" }] })))
    })
  })

  it("SHOW_MOCKUP auto-executes and shows loading state", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      createSSEResponse([{ type: "chunk", text: "[ACTION:SHOW_MOCKUP] https://design.png|tshirt|black|front|R3" }])
    )
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(() => {}))

    renderAssistant()
    await openChat()

    const input = screen.getByPlaceholderText("Escribí tu mensaje...")
    await userEvent.type(input, "Ponelo en una remera")
    fireEvent.keyDown(input, { key: "Enter" })

    await waitFor(() => {
      expect(screen.getByText("Creando mockup...")).toBeInTheDocument()
      expect(screen.getByText("Estampando en la prenda")).toBeInTheDocument()
    })
  })

  it("ADD_TO_CART adds item to cart", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      createSSEResponse([{ type: "chunk", text: "Listo! [ACTION:ADD_TO_CART] Remera Custom|aura-oversize-tshirt|black|M|31000|https://mockup.png" }])
    )

    renderAssistant()
    await openChat()

    const input = screen.getByPlaceholderText("Escribí tu mensaje...")
    await userEvent.type(input, "Agregalo al carrito")
    fireEvent.keyDown(input, { key: "Enter" })

    // ADD_TO_CART is NOT auto-executed — shows a button
    await waitFor(() => {
      expect(screen.getByText("Agregar al carrito")).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText("Agregar al carrito"))

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Remera Custom",
          color: "black",
          size: "M",
        })
      )
    })
  })

  it("SHOW_PRICING shows pricing info", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      createSSEResponse([{ type: "chunk", text: "Acá van los precios [ACTION:SHOW_PRICING]" }])
    )
    renderAssistant()
    await openChat()

    const input = screen.getByPlaceholderText("Escribí tu mensaje...")
    await userEvent.type(input, "Cuanto sale?")
    fireEvent.keyDown(input, { key: "Enter" })

    await waitFor(() => {
      expect(screen.getByText(/Precios.*incluyen diseño/)).toBeInTheDocument()
      expect(screen.getByText("Aura Oversize")).toBeInTheDocument()
      expect(screen.getByText("Hoodie Unisex")).toBeInTheDocument()
    })
  })
})

// ========== D) Error Handling Tests ==========

describe("D) Error handling", () => {
  it("network error shows error message", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"))

    renderAssistant()
    await openChat()

    const input = screen.getByPlaceholderText("Escribí tu mensaje...")
    await userEvent.type(input, "Hola")
    fireEvent.keyDown(input, { key: "Enter" })

    await waitFor(() => {
      expect(screen.getByText("Error de conexión. Intentá de nuevo.")).toBeInTheDocument()
    })
  })

  it("empty input does not send message", async () => {
    renderAssistant()
    await openChat()

    const input = screen.getByPlaceholderText("Escribí tu mensaje...")
    fireEvent.keyDown(input, { key: "Enter" })

    expect(fetch).not.toHaveBeenCalled()
  })

  it("image upload validates max count (3)", async () => {
    renderAssistant()
    await openChat()

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).not.toBeNull()

    const files = [
      new File(["a"], "img1.png", { type: "image/png" }),
      new File(["b"], "img2.png", { type: "image/png" }),
      new File(["c"], "img3.png", { type: "image/png" }),
      new File(["d"], "img4.png", { type: "image/png" }),
    ]

    await act(async () => {
      fireEvent.change(fileInput, { target: { files } })
    })

    expect(URL.createObjectURL).toHaveBeenCalledTimes(3)
  })

  it("HTTP error response shows error message", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Servicio no disponible" }), { status: 500 })
    )

    renderAssistant()
    await openChat()

    const input = screen.getByPlaceholderText("Escribí tu mensaje...")
    await userEvent.type(input, "Hola")
    fireEvent.keyDown(input, { key: "Enter" })

    await waitFor(() => {
      expect(screen.getByText("Servicio no disponible")).toBeInTheDocument()
    })
  })
})
