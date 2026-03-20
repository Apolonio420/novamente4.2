# Guia del Catalogo de Productos — Novamente Workspace

## Para que sirve el Catalogo

El catalogo es donde administras todos tus productos. Desde aca podes crear, editar, publicar y organizar los articulos que van a aparecer en tu storefront publico y en tus campanas de venta.

---

## Crear un Producto Nuevo

Ir a **Catalogo** → boton **+** (Agregar producto).

### Campos del formulario

| Campo | Detalle |
|-------|---------|
| **Nombre** | Nombre del producto. Claro y descriptivo. |
| **Descripcion** | Maximo 500 caracteres. Describe materiales, uso, diferencial. |
| **Categoria** | Remera, Hoodie, Canvas, Accesorios, etc. |
| **Precio** | En pesos argentinos (ARS). |
| **Imagenes** | Hasta 5 imagenes por producto. Formatos: JPG, PNG, WebP. Max 5MB por imagen. |
| **Variantes de color** | Cada variante incluye: nombre del color, codigo hexadecimal, imagen frente, imagen espalda |
| **Talles disponibles** | S, M, L, XL (marcar los que tenes stock) |
| **Caracteristicas** | Lista de atributos destacados (ej: "100% algodon", "Corte oversize") |
| **Tags** | Palabras clave para busqueda interna y SEO |

### Como agregar variantes de color

1. En la seccion "Colores", hacer click en **+ Agregar color**
2. Escribir el nombre del color (ej: "Negro Carbon")
3. Seleccionar el codigo hex en el color picker o escribirlo manualmente
4. Subir imagen del frente con ese color
5. Subir imagen de la espalda (opcional pero recomendado)
6. Repetir para cada color disponible

---

## Estados de Producto

Cada producto tiene un estado que controla su visibilidad y flujo de revision:

| Estado | Descripcion |
|--------|-------------|
| **draft** | Borrador. Solo vos lo ves. No aparece en el storefront. |
| **needs_review** | Enviado para revision interna de Novamente. |
| **ready** | Aprobado por Novamente, listo para publicar. |
| **published** | Visible en tu storefront publico. |
| **hidden** | Activo pero oculto temporalmente del storefront. |
| **archived** | Desactivado. No visible, pero los datos se conservan. |

**Flujo tipico:** draft → needs_review → ready → published

---

## Editar un Producto

1. Ir a **Catalogo** → hacer click en el producto
2. Modificar los campos necesarios
3. Guardar cambios

Los cambios en productos publicados se reflejan en el storefront automaticamente.

---

## Eliminar un Producto

- Desde el listado, hacer click en los tres puntos (...) del producto → **Archivar** o **Eliminar**
- Archivar conserva el historial; Eliminar es permanente
- No se pueden eliminar productos que tengan pedidos asociados

---

## Limites por Plan

| Plan | Productos maximos |
|------|------------------|
| **Starter** (gratis) | 10 productos |
| **Growth** ($25 USD/mes) | Ilimitados |
| **Pro** ($100 USD/mes) | Ilimitados |

Cuando alcanzas el limite del plan Starter, el boton **+** se desactiva y te muestra un mensaje para upgradear.

---

## Importacion Masiva (Bulk Import)

Disponible en planes Growth y Pro. Permite subir multiples productos desde un archivo CSV estructurado.

1. Ir a **Catalogo** → boton **Importar**
2. Descargar la plantilla CSV de ejemplo
3. Completar los datos siguiendo el formato
4. Subir el archivo
5. Revisar preview → confirmar importacion

Los productos importados entran en estado **draft** por defecto.

---

## Consejos para un Catalogo Efectivo

- **Fotos de calidad**: Usar fondo blanco o neutro. Mostrar frente y espalda.
- **Descripcion clara**: Mencionar material, calidad, fit y uso recomendado.
- **Precios precisos**: Mantener precios actualizados. Un precio desactualizado baja la confianza.
- **Tags relevantes**: Incluir terminos que tus clientes usarian para buscar (ej: "remera negra oversize hombre").
- **Variantes completas**: Si ofreces varios colores, cargar todos con sus imagenes. Mas opciones = mas ventas.
- **Descripciones unicas**: No copiar descripciones genericas. El texto propio mejora el posicionamiento SEO de tu storefront.
