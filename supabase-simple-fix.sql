-- Script simple para corregir problemas de consultas de usuarios
-- Ejecutar paso a paso

-- Paso 1: Verificar políticas actuales
SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Paso 2: Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can delete their own data" ON users;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable all operations for all users" ON users;

-- Paso 3: Crear una política simple y permisiva
CREATE POLICY "users_all_access" ON users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Paso 4: Verificar que se creó correctamente
SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Paso 5: Probar la consulta
SELECT * FROM users WHERE email = 'emprendetucarrera10@gmail.com';
