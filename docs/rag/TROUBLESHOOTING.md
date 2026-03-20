# Solucion de Problemas Comunes — Novamente Workspace

## Problemas con Imagenes

### "No puedo subir imagenes"

**Verificar:**
- **Formato del archivo**: Solo se aceptan JPG, PNG y WebP. Los archivos BMP, TIFF, HEIC y GIF animados no son compatibles.
- **Tamaño del archivo**: El maximo por imagen es **5MB**. Comprimir la imagen si supera ese limite (herramienta recomendada: squoosh.app).
- **Cantidad de imagenes**: El maximo por producto es 5 imagenes. Si ya tenes 5, elimina una antes de subir otra.
- **Conexion**: Una conexion lenta puede hacer que la subida falle. Intentar desde una red mas estable.

**Si ninguno aplica:** Recargar la pagina e intentar de nuevo. Si persiste, reportarlo por este asistente.

---

## Problemas con el Storefront

### "Mi storefront no es visible"

Verificar en orden:

1. **Toggle de publicacion activo**: Ir a **Configuracion** → el toggle "Publicar storefront" debe estar encendido (verde).
2. **Al menos un producto publicado**: Sin productos en estado "published", el storefront aparece vacio. Verificar el catalogo.
3. **Cuenta activa**: Si hubo un problema de pago, el storefront se suspende. Ir a **Facturacion y Planes** para verificar el estado de la cuenta.
4. **URL correcta**: La URL de tu storefront es `novamente.ar/tu-slug`. Si no sabes cual es tu slug, verlo en Configuracion.

---

### "El storefront se ve mal o desactualizado"

- Limpiar la cache del navegador (Ctrl+Shift+R o Cmd+Shift+R).
- Probar en modo incognito para descartar cache local.
- Los cambios de branding pueden tardar hasta **5 minutos** en propagarse.

---

## Problemas con el Design Engine

### "La generacion de diseño fallo"

**Causas comunes y soluciones:**

- **Prompt demasiado largo**: Intentar con un prompt mas corto y directo (menos de 200 caracteres funciona mejor).
- **Caracteres especiales**: Evitar comillas dobles, barras, asteriscos o emojis en el prompt.
- **Limite de uso alcanzado**: Segun tu plan, hay un limite de generaciones. Verificar en la pagina del Design Engine si se muestra algun aviso de limite.
- **Error temporal del servidor**: Esperar 30 segundos y volver a intentar.

Si el error persiste con prompts simples, puede ser un problema tecnico. Reportarlo por este asistente.

---

### "El mockup se ve raro o el diseño no se ve bien en la prenda"

- Intentar generar de nuevo con el mismo prompt (hay variacion en cada generacion).
- Cambiar la cara de la prenda (probar frente vs espalda).
- Simplificar el diseño: prompts con mucho detalle a veces generan composiciones complejas que no lucen bien en formato de estampa.

---

## Problemas de Sesion y Login

### "Mi sesion expiro / me deslogeo solo"

- Recargar la pagina. En muchos casos la sesion se renueva automaticamente.
- Si el problema persiste, cerrar el navegador completamente y volver a entrar a `/partners/login`.
- **Limpiar cookies**: Si sigue fallando, ir a la configuracion del navegador → borrar cookies para el dominio novamente.ar → volver a iniciar sesion.

---

### "Olvide mi contrasena"

Ir a `/partners/login` → click en **"Olvide mi contrasena"** → ingresar tu email → revisar la bandeja de entrada (incluyendo spam) → seguir el link para resetear.

---

## Problemas con Productos

### "Mis productos no aparecen en el storefront"

El producto tiene que estar en estado **"published"**. Los estados que NO muestran el producto publicamente son:
- `draft` — borrador, solo visible para vos
- `hidden` — oculto manualmente
- `needs_review` — esperando aprobacion de Novamente
- `archived` — desactivado

Para publicar: ir al catalogo → seleccionar el producto → cambiar el estado a "published".

---

## Problemas con Analytics

### "Analytics no muestra datos / aparece vacio"

- **Plan necesario**: Analytics requiere plan **Growth o Pro**. En el plan Starter esta seccion no esta disponible.
- **Espera inicial**: Despues de activar un plan con analytics, los datos pueden tardar hasta **24 horas** en comenzar a aparecer.
- **Sin trafico**: Si nadie visito tu storefront, no hay datos que mostrar. Compartir el link del storefront para generar visitas.

---

## Problemas con Leads

### "Llegue al limite de leads"

El plan Starter permite **20 leads por mes**. Al alcanzar el limite, los nuevos contactos desde el storefront no se registran hasta el mes siguiente o hasta upgradear a Growth o Pro.

Para upgradear: ir a **Cuenta** → **Facturacion y Planes** → **Upgradear a Growth**.

---

## Problemas con el Design Engine (Acceso)

### "No puedo acceder al Design Engine / aparece bloqueado"

El Design Engine en su version completa requiere plan **Growth o Pro**. Los usuarios del plan Starter tienen acceso limitado.

Para acceder al Design Engine completo, upgradear desde **Cuenta** → **Facturacion y Planes**.

---

## Problemas de Velocidad

### "La pagina carga muy lento"

- La **primera carga** del workspace puede ser mas lenta porque el sistema indexa la base de conocimiento del asistente. Las cargas siguientes son significativamente mas rapidas.
- Si la lentitud persiste en todas las cargas, verificar la conexion a internet.
- Intentar desde otro navegador o dispositivo para descartar un problema local.

---

## Como Reportar un Bug

Si encontras un problema que no esta cubierto en esta guia:

1. **Usar este asistente**: Describir el problema en detalle — que intentabas hacer, que paso, que mensaje de error aparecio.
2. **Incluir capturas de pantalla**: Si podes, agregar una imagen del error. Ayuda enormemente a diagnosticar el problema.
3. **Indicar el navegador y dispositivo**: Chrome en Android, Safari en iPhone, etc.

Para problemas urgentes que bloquean tu operacion, contactar directamente a: **soporte@novamente.ar**

Los partners del plan Pro tienen acceso a soporte por WhatsApp para resolucion prioritaria.
