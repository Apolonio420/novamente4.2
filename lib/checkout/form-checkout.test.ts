import { describe, it, expect } from "vitest"
import { camposFaltantes, mensajeCamposFaltantes, envioAMostrar, erroresCampos, mensajeErrores } from "./form-checkout"

const completo = { email: "a@b.c", firstName: "A", lastName: "B", phone: "11", address: "Calle 1", city: "CABA", postalCode: "1414" }

describe("camposFaltantes", () => {
  it("completo → nada falta", () => {
    expect(camposFaltantes(completo)).toEqual([])
    expect(mensajeCamposFaltantes([])).toBeNull()
  })
  it("detecta vacíos y espacios, en orden del formulario", () => {
    const faltan = camposFaltantes({ ...completo, postalCode: "  ", phone: "" })
    expect(faltan).toEqual(["phone", "postalCode"])
    expect(mensajeCamposFaltantes(faltan)).toContain("teléfono y código postal")
  })
  it("un solo campo", () => {
    expect(mensajeCamposFaltantes(["city"])).toContain("completá: ciudad.")
  })
})

describe("envioAMostrar", () => {
  const items = [{ price: 35750, quantity: 1 }]
  it("usa el envío guardado", () => {
    expect(envioAMostrar({ shippingCost: 9300, amount: 45050, items })).toBe(9300)
    expect(envioAMostrar({ shippingCost: 0, amount: 35750, items })).toBe(0)
  })
  it("datos viejos sin shippingCost: lo deduce del total (caso real la-blancq: 45.050 − 35.750)", () => {
    expect(envioAMostrar({ amount: 45050, items })).toBe(9300)
  })
  it("con descuento lo suma de vuelta para no mostrar envío de menos", () => {
    expect(envioAMostrar({ amount: 40050, discountARS: 5000, items })).toBe(9300)
  })
})

describe("erroresCampos", () => {
  it("completo → sin errores", () => {
    expect(erroresCampos(completo)).toEqual({})
    expect(mensajeErrores({})).toBeNull()
  })
  it("todo vacío → un error por campo, en orden del formulario", () => {
    const e = erroresCampos({})
    expect(Object.keys(e)).toEqual(["email", "firstName", "lastName", "phone", "address", "city", "postalCode"])
    expect(e.postalCode).toBe("Completá el código postal")
  })
  it("email sin formato → error de formato; teléfono sin números → error", () => {
    const e = erroresCampos({ ...completo, email: "juan@gmail", phone: "no tengo" })
    expect(e.email).toMatch(/Revisá el email/)
    expect(e.phone).toMatch(/números/)
    expect(Object.keys(e)).toEqual(["email", "phone"])
    expect(mensajeErrores(e)).toContain("Revisá el email")
  })
  it("no es más estricto que antes salvo el email: teléfono corto con dígitos y CP cualquiera pasan", () => {
    expect(erroresCampos({ ...completo, phone: "11", postalCode: "B1603" })).toEqual({})
  })
  it("mensaje mezcla vacíos + formato", () => {
    const m = mensajeErrores(erroresCampos({ ...completo, email: "x", city: "" }))
    expect(m).toContain("completá: ciudad")
    expect(m).toContain("Revisá el email")
  })
})
