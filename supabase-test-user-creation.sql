-- Script para probar la creación de usuarios directamente en Supabase
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estructura de la tabla users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Verificar datos actuales
SELECT * FROM users;

-- 3. Intentar crear un usuario de prueba
INSERT INTO users (email, name, role) 
VALUES ('test@example.com', 'Usuario Test', 'user');

-- 4. Verificar que se creó
SELECT * FROM users WHERE email = 'test@example.com';

-- 5. Intentar crear otro usuario con datos similares a los del error
INSERT INTO users (email, name, role) 
VALUES ('emprendetucarrera23@gmail.com', 'Usuario Prueba', 'user');

-- 6. Verificar que se creó
SELECT * FROM users WHERE email = 'emprendetucarrera23@gmail.com';

-- 7. Limpiar usuarios de prueba
-- DELETE FROM users WHERE email IN ('test@example.com', 'emprendetucarrera23@gmail.com');
