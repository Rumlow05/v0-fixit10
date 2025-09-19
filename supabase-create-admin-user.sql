-- supabase-create-admin-user.sql
-- Script simple para crear el usuario administrador

-- Crear usuario administrador principal
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

-- Verificar que el usuario fue creado
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM users 
WHERE email = 'tech@emprendetucarrera.com.co';
