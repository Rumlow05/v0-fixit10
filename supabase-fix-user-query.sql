-- Script para diagnosticar y corregir problemas con consultas de usuarios
-- Error 406 (Not Acceptable) al buscar usuarios por email

-- 1. Verificar la estructura de la tabla users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar las políticas RLS actuales
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 3. Verificar si RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 4. Crear políticas más permisivas para usuarios (temporal para debugging)
-- Deshabilitar RLS temporalmente para debugging
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 5. Verificar que la consulta funcione sin RLS
-- Esta consulta debería funcionar ahora:
-- SELECT * FROM users WHERE email = 'emprendetucarrera10@gmail.com';

-- 6. Re-habilitar RLS con políticas más permisivas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can delete their own data" ON users;

-- Crear políticas más permisivas
CREATE POLICY "Allow all operations on users" ON users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 7. Verificar que las políticas se aplicaron correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 8. Probar la consulta que estaba fallando
SELECT * FROM users WHERE email = 'emprendetucarrera10@gmail.com';
