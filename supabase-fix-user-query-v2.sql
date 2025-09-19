-- Script mejorado para diagnosticar y corregir problemas con consultas de usuarios
-- Maneja el caso donde las políticas ya existen

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

-- 4. Eliminar políticas existentes de forma segura (usando IF EXISTS)
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can delete their own data" ON users;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable all operations for all users" ON users;

-- 5. Crear una política más permisiva y específica
CREATE POLICY "Enable all operations for authenticated users" ON users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Verificar que las políticas se aplicaron correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 7. Probar la consulta que estaba fallando
SELECT * FROM users WHERE email = 'emprendetucarrera10@gmail.com';

-- 8. Verificar que RLS está habilitado pero con políticas permisivas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 9. Si aún hay problemas, deshabilitar RLS temporalmente para debugging
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 10. Probar la consulta sin RLS (solo para debugging)
-- SELECT * FROM users WHERE email = 'emprendetucarrera10@gmail.com';

-- 11. Re-habilitar RLS después del debugging
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
