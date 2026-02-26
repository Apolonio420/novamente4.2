import { z } from "zod";

export const quoteItemSchema = z.object({
  quantity: z.number().int().positive("La cantidad debe ser mayor a 0"),
  product: z.string().min(1, "La prenda es requerida"),
  color: z.string().optional(),
  size: z.string().optional(),
  doublePrint: z.boolean().default(false),
  unitPrice: z.number().nonnegative("El precio unitario no puede ser negativo"),
});

export const quoteSchema = z.object({
  clientName: z.string().min(1, "El nombre del cliente es requerido"),
  clientContact: z.string().optional(), // Email or WhatsApp
  observations: z.string().optional(),
  items: z.array(quoteItemSchema).max(25, "Máximo 25 items permitidos"),
  shippingCost: z.number().nonnegative("El costo de envío no puede ser negativo").default(0),
});

export type QuoteItem = z.infer<typeof quoteItemSchema>;
export type QuoteData = z.infer<typeof quoteSchema>;
