-- Script para verificar el esquema real de la base de datos
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estructura de la tabla tickets
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
ORDER BY ordinal_position;

-- 2. Verificar estructura de la tabla users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 3. Verificar estructura de la tabla comments (o ticket_comments)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'comments' 
ORDER BY ordinal_position;

-- 4. Si comments no existe, verificar ticket_comments
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'ticket_comments' 
ORDER BY ordinal_position;

-- 5. Verificar todas las tablas disponibles
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
