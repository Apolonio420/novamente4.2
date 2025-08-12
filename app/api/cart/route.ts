import { NextResponse } from "next/server"
import { getCartItems, addToCart, removeFromCart, updateCartItem } from "@/lib/db"

export async function GET() {
  try {
    const cartItems = await getCartItems()
    return NextResponse.json({ items: cartItems })
  } catch (error) {
    console.error("Error fetching cart items:", error)
    return NextResponse.json({ error: "Failed to fetch cart items" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const item = await request.json()

    if (!item.garmentType || !item.size || !item.imageUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const newItem = await addToCart(item)
    return NextResponse.json({ item: newItem })
  } catch (error) {
    console.error("Error adding item to cart:", error)
    return NextResponse.json({ error: "Failed to add item to cart" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    await removeFromCart(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing item from cart:", error)
    return NextResponse.json({ error: "Failed to remove item from cart" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, quantity } = await request.json()

    if (!id || typeof quantity !== "number") {
      return NextResponse.json({ error: "Item ID and quantity are required" }, { status: 400 })
    }

    await updateCartItem(id, quantity)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating cart item:", error)
    return NextResponse.json({ error: "Failed to update cart item" }, { status: 500 })
  }
}
