-- Script para migrar imágenes existentes a URLs permanentes
-- Este script identifica imágenes con URLs temporales de R2 y las marca para re-archivado

-- Identificar imágenes con URLs temporales de R2 que necesitan ser migradas
SELECT 
    id,
    url,
    storage_url,
    created_at,
    CASE 
        WHEN url LIKE '%X-Amz-Algorithm%' OR url LIKE '%X-Amz-Signature%' THEN 'TEMPORAL_R2'
        WHEN url LIKE '%r2.dev%' OR url LIKE '%r2.cloudflarestorage.com%' THEN 'PERMANENT_R2'
        WHEN url LIKE '%oaidalleapiprodscus.blob.core.windows.net%' THEN 'DALLE'
        WHEN url LIKE '%supabase.co%' THEN 'SUPABASE'
        ELSE 'OTHER'
    END as url_type
FROM images 
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Contar imágenes por tipo
SELECT 
    CASE 
        WHEN url LIKE '%X-Amz-Algorithm%' OR url LIKE '%X-Amz-Signature%' THEN 'TEMPORAL_R2'
        WHEN url LIKE '%r2.dev%' OR url LIKE '%r2.cloudflarestorage.com%' THEN 'PERMANENT_R2'
        WHEN url LIKE '%oaidalleapiprodscus.blob.core.windows.net%' THEN 'DALLE'
        WHEN url LIKE '%supabase.co%' THEN 'SUPABASE'
        ELSE 'OTHER'
    END as url_type,
    COUNT(*) as count
FROM images 
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY url_type
ORDER BY count DESC;

