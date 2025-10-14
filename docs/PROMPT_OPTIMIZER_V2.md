# Sistema de Optimización de Prompts v2 - NovaMente

## Descripción General

El nuevo sistema de optimización de prompts está diseñado específicamente para NovaMente, siguiendo las instrucciones del sistema para generar estampas de alta calidad para prendas de vestir. El sistema mantiene la consistencia visual de marca y optimiza los prompts para impresión DTF/sublimación.

## Características Principales

### 🎨 Parámetros de Marca NovaMente
- **Tipos de Prenda**: buzo-oversize, remera-oversize, remera-clasica
- **Colorways**: crema, negro, blanco, gris, caramel, marron
- **Áreas de Impresión**: R1 (10×10 cm), R2 (20×20 cm), R3 (35×40 cm), espalda-completa, pecho-pequeno
- **Estilos Artísticos**: minimalista-lineal, geometrico, surrealista, cartoon, ghibli-like, vintage, vectorial, manga-estilizado

### ⚡ Optimizaciones Automáticas
- Detección automática de parámetros desde el prompt del usuario
- Generación de variantes con diferentes estilos artísticos
- Sugerencias específicas para impresión textil
- Paletas de colores compatibles con DTF/sublimación

## Estructura del Sistema

### Archivos Principales

1. **`lib/advanced-prompt-optimizer.ts`**
   - Sistema principal de optimización
   - Definición de parámetros de marca
   - Generación de variantes y sugerencias

2. **`lib/promptOptimizer.ts`**
   - Cliente para la API de optimización
   - Integración con el sistema existente
   - Manejo de errores y fallbacks

3. **`app/api/optimize-prompt/route.ts`**
   - API endpoint para optimización
   - Integración con el sistema avanzado
   - Respuesta con variantes y sugerencias

4. **`components/BrandParametersSelector.tsx`**
   - Selector de parámetros de marca
   - Interfaz para configurar prenda, color, área, estilo

5. **`components/PromptOptimizationResults.tsx`**
   - Visualización de resultados de optimización
   - Muestra variantes y sugerencias
   - Interfaz para usar prompts optimizados

## Uso del Sistema

### 1. Optimización Básica

```typescript
import { optimizePromptForNovaMente } from '@/lib/advanced-prompt-optimizer'

const result = optimizePromptForNovaMente("león majestuoso", {
  garmentType: 'remera-oversize',
  colorway: 'negro',
  printArea: 'R3',
  artisticStyle: 'vectorial'
})
```

### 2. Detección Automática

```typescript
import { detectBrandParametersFromPrompt } from '@/lib/advanced-prompt-optimizer'

const params = detectBrandParametersFromPrompt("buzo negro con dragón minimalista")
// Detecta: garmentType: 'buzo-oversize', colorway: 'negro', artisticStyle: 'minimalista-lineal'
```

### 3. Uso en Componentes

```tsx
import { BrandParametersSelector } from '@/components/BrandParametersSelector'
import { PromptOptimizationResults } from '@/components/PromptOptimizationResults'

// En tu componente
const [brandParams, setBrandParams] = useState({})
const [optimizationResult, setOptimizationResult] = useState(null)

<BrandParametersSelector
  onParametersChange={setBrandParams}
  initialParams={brandParams}
/>

{optimizationResult && (
  <PromptOptimizationResults
    result={optimizationResult}
    onUsePrompt={handleUsePrompt}
    onRegenerate={handleRegenerate}
  />
)}
```

## Estilos Artísticos Disponibles

### Optimizados para Impresión
- **Minimalista Lineal**: Líneas limpias, formas simples, mucho espacio en blanco
- **Arte Geométrico**: Formas geométricas, patrones abstractos, colores planos
- **Cartoon/Ilustración**: Estilo caricaturesco, colores brillantes, líneas definidas
- **Estilo Ghibli**: Inspirado en Studio Ghibli, suave, orgánico, colores pastel
- **Vintage/Retro**: Estilo retro, colores desaturados, texturas envejecidas
- **Ilustración Vectorial**: Diseño vectorial, colores planos, perfecto para impresión
- **Manga Estilizado**: Inspirado en manga/anime, líneas dinámicas, sombreado suave

### Requieren Simplificación
- **Surrealista**: Elementos oníricos, composiciones inusuales, colores vibrantes

## Paletas de Colores por Colorway

### Crema
- `#F5F5DC`, `#8B4513`, `#000000`, `#FFFFFF`, `#D2691E`

### Negro
- `#000000`, `#FFFFFF`, `#FFD700`, `#FF0000`, `#00FF00`

### Blanco
- `#FFFFFF`, `#000000`, `#FF6B6B`, `#4ECDC4`, `#45B7D1`

### Gris
- `#808080`, `#000000`, `#FFFFFF`, `#FFA500`, `#FF69B4`

### Caramel
- `#D2691E`, `#8B4513`, `#FFFFFF`, `#000000`, `#F4A460`

### Marrón
- `#8B4513`, `#A0522D`, `#FFFFFF`, `#000000`, `#D2691E`

## Áreas de Impresión

### R1 (10×10 cm)
- Diseño centrado, ideal para logos o símbolos
- Máximo 3 colores
- Composición compacta

### R2 (20×20 cm)
- Área mediana, más espacio para detalles
- Máximo 4 colores
- Composición equilibrada

### R3 (35×40 cm)
- Área grande, espalda completa
- Máximo 5 colores
- Composición completa con máximo detalle

## Flujo de Optimización

1. **Entrada**: Prompt del usuario + parámetros de marca (opcionales)
2. **Detección**: Análisis automático del prompt para extraer parámetros
3. **Aplicación**: Aplicación de parámetros de marca NovaMente
4. **Optimización**: Generación del prompt optimizado principal
5. **Variantes**: Creación de 2-3 variantes con estilos compatibles
6. **Sugerencias**: Generación de sugerencias específicas para impresión
7. **Salida**: Prompt optimizado + variantes + sugerencias

## Ejemplo de Uso Completo

```typescript
// 1. Configurar parámetros de marca
const brandParams = {
  garmentType: 'remera-oversize',
  colorway: 'negro',
  printArea: 'R3',
  artisticStyle: 'vectorial'
}

// 2. Optimizar prompt
const result = optimizePromptForNovaMente("dragón épico", brandParams)

// 3. Resultado
console.log(result.optimizedPrompt)
// "Ilustración: dragón épico. vector illustration, flat design, clean graphics, print ready, scalable. large print area, full back design, maximum detail, complex composition. Alta resolución, colores planos, contraste optimizado para estampado textil. Composición completa, máximo detalle. Fondo transparente o blanco, sin elementos adicionales"

console.log(result.variants)
// Array con 2-3 variantes con estilos diferentes

console.log(result.printSuggestions)
// Array con sugerencias específicas para impresión
```

## Integración con el Sistema Existente

El nuevo sistema es completamente compatible con el sistema existente:

- **API Backward Compatible**: La API `/api/optimize-prompt` mantiene compatibilidad
- **Fallback Automático**: Si falla la optimización avanzada, usa el sistema anterior
- **Integración Gradual**: Los componentes existentes pueden migrar gradualmente

## Beneficios del Nuevo Sistema

1. **Consistencia de Marca**: Todos los prompts siguen los parámetros de NovaMente
2. **Optimización para Impresión**: Prompts específicamente optimizados para DTF/sublimación
3. **Variantes Creativas**: Múltiples opciones de estilo manteniendo la coherencia
4. **Detección Inteligente**: Análisis automático del prompt del usuario
5. **Sugerencias Prácticas**: Consejos específicos para cada tipo de impresión
6. **Escalabilidad**: Fácil agregar nuevos estilos, colores o tipos de prenda

## Próximas Mejoras

- [ ] Integración con el sistema de prendas red-square
- [ ] Optimización basada en el historial del usuario
- [ ] Aprendizaje automático de preferencias
- [ ] Integración con el sistema de colores de prendas
- [ ] Análisis de tendencias de diseño




