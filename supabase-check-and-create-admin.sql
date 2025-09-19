-- supabase-check-and-create-admin.sql
-- Script para verificar usuarios existentes y crear el administrador si es necesario

-- 1. Verificar usuarios existentes en la base de datos
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM users 
ORDER BY created_at DESC;

-- 2. Verificar si el usuario administrador existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM users WHERE email = 'tech@emprendetucarrera.com.co') 
        THEN 'Usuario administrador EXISTE'
        ELSE 'Usuario administrador NO EXISTE'
    END as admin_status;

-- 3. Crear usuario administrador si no existe
INSERT INTO users (id, email, name, phone, role, created_at, updated_at)
VALUES (
    '2af4b6bf-01fe-4b9f-9611-35178dc75c30',
    'tech@emprendetucarrera.com.co',
    'Administrador Principal',
    '+573001234567',
    'admin',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- 4. Verificar que el usuario administrador fue creado/actualizado
SELECT 
    id,
    email,
    name,
    role,
    created_at,
    updated_at
FROM users 
WHERE email = 'tech@emprendetucarrera.com.co';

-- 5. Mostrar todos los usuarios después de la operación
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM users 
ORDER BY created_at DESC;
