-- supabase-diagnose-and-fix-users.sql
-- Script para diagnosticar y solucionar problemas con la tabla users

-- 1. Verificar si la tabla users existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'users';

-- 2. Verificar estructura de la tabla users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- 4. Verificar políticas RLS existentes
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- 5. Contar usuarios existentes
SELECT COUNT(*) as total_users FROM users;

-- 6. Mostrar usuarios existentes (si los hay)
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM users 
ORDER BY created_at DESC;

-- 7. Crear política RLS permisiva si no existe
DO $$ 
BEGIN
    -- Eliminar políticas existentes que puedan estar causando problemas
    DROP POLICY IF EXISTS "Allow all operations on users" ON public.users;
    DROP POLICY IF EXISTS "users_all_access" ON public.users;
    
    -- Crear política permisiva
    CREATE POLICY "users_all_access"
    ON public.users
    FOR ALL
    TO public, authenticated
    USING (true) WITH CHECK (true);
    
    RAISE NOTICE 'Política RLS creada exitosamente';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creando política: %', SQLERRM;
END $$;

-- 8. Habilitar RLS si no está habilitado
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 9. Insertar usuarios iniciales
INSERT INTO users (id, email, name, phone, role, created_at, updated_at)
VALUES 
    (
        '2af4b6bf-01fe-4b9f-9611-35178dc75c30',
        'tech@emprendetucarrera.com.co',
        'Administrador Principal',
        '+573001234567',
        'admin',
        NOW(),
        NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440001',
        'user@fixit.com',
        'Usuario Test',
        '+573007654321',
        'user',
        NOW(),
        NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440002',
        'level1@fixit.com',
        'Técnico Nivel 1',
        '+573007654322',
        'level1',
        NOW(),
        NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440003',
        'level2@fixit.com',
        'Técnico Nivel 2',
        '+573007654323',
        'level2',
        NOW(),
        NOW()
    )
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- 10. Verificar que los usuarios fueron creados
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM users 
ORDER BY created_at DESC;

-- 11. Verificar políticas finales
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users';
