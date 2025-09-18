-- Script para corregir las políticas RLS de la tabla users
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar las políticas restrictivas existentes
DROP POLICY IF EXISTS "Users can insert themselves" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;

-- 2. Crear políticas más permisivas para desarrollo
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);

-- 3. Verificar que las políticas se crearon correctamente
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

-- 4. Probar la creación de un usuario manualmente
-- INSERT INTO users (email, name, role) 
-- VALUES ('test@example.com', 'Usuario Test', 'user');

-- 5. Verificar que el usuario se creó
-- SELECT * FROM users WHERE email = 'test@example.com';

-- 6. Limpiar el usuario de prueba
-- DELETE FROM users WHERE email = 'test@example.com';
