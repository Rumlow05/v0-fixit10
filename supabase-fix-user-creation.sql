-- Script para corregir problemas de creación de usuarios
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estructura actual de la tabla users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Verificar si hay restricciones que impidan la inserción
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'users';

-- 3. Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 4. Intentar crear un usuario de prueba manualmente
-- INSERT INTO users (email, name, role) 
-- VALUES ('test@example.com', 'Usuario Test', 'user');

-- 5. Si hay problemas, recrear la tabla users con la estructura correcta
-- DROP TABLE IF EXISTS users CASCADE;
-- CREATE TABLE users (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   email VARCHAR(255) UNIQUE NOT NULL,
--   name VARCHAR(255) NOT NULL,
--   phone VARCHAR(20),
--   role VARCHAR(50) NOT NULL DEFAULT 'user',
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- 6. Recrear políticas RLS
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);

-- 7. Recrear índices
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 8. Insertar usuario administrador por defecto
-- INSERT INTO users (id, email, name, phone, role, created_at, updated_at)
-- VALUES (
--   '2af4b6bf-01fe-4b9f-9611-35178dc75c30',
--   'tech@emprendetucarrera.com.co',
--   'Administrador',
--   '+573001234567',
--   'admin',
--   NOW(),
--   NOW()
-- ) ON CONFLICT (email) DO NOTHING;
