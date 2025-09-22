#!/usr/bin/env node

/**
 * Script para migrar imágenes existentes a URLs permanentes
 * Este script identifica imágenes con URLs temporales y las migra a URLs permanentes de R2
 */

const { createClient } = require('@supabase/supabase-js')
const { uploadToR2, getPublicR2Url } = require('../lib/cloudflare-r2')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateImages() {
  console.log('🚀 Iniciando migración de imágenes a URLs permanentes...')
  
  try {
    // Obtener imágenes con URLs temporales de R2
    const { data: temporalImages, error } = await supabase
      .from('images')
      .select('id, url, storage_url, created_at')
      .or('url.like.%X-Amz-Algorithm%,url.like.%X-Amz-Signature%')
      .is('storage_url', null)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('❌ Error obteniendo imágenes temporales:', error)
      return
    }

    console.log(`📊 Encontradas ${temporalImages.length} imágenes con URLs temporales`)

    let migrated = 0
    let errors = 0

    for (const image of temporalImages) {
      try {
        console.log(`🔄 Migrando imagen ${image.id}...`)
        
        // Descargar la imagen
        const response = await fetch(image.url)
        if (!response.ok) {
          throw new Error(`Error descargando imagen: ${response.status}`)
        }
        
        const buffer = await response.arrayBuffer()
        
        // Generar nombre único para R2
        const filename = `migrated-${image.id}-${Date.now()}`
        const r2Key = `migrated/${filename}.png`
        
        // Subir a R2 con URL permanente
        const permanentUrl = await uploadToR2(Buffer.from(buffer), r2Key, 'image/png')
        
        // Actualizar en la base de datos
        const { error: updateError } = await supabase
          .from('images')
          .update({ 
            storage_url: permanentUrl,
            url: permanentUrl // También actualizar la URL principal
          })
          .eq('id', image.id)

        if (updateError) {
          throw new Error(`Error actualizando BD: ${updateError.message}`)
        }

        console.log(`✅ Migrada: ${image.id} -> ${permanentUrl}`)
        migrated++
        
        // Pausa pequeña para no sobrecargar R2
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`❌ Error migrando imagen ${image.id}:`, error.message)
        errors++
      }
    }

    console.log(`\n🎉 Migración completada:`)
    console.log(`✅ Imágenes migradas: ${migrated}`)
    console.log(`❌ Errores: ${errors}`)
    
  } catch (error) {
    console.error('❌ Error en la migración:', error)
  }
}

// Ejecutar migración
if (require.main === module) {
  migrateImages()
    .then(() => {
      console.log('🏁 Script de migración finalizado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error)
      process.exit(1)
    })
}

module.exports = { migrateImages }

