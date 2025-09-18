-- Script para verificar el estado del usuario antes y después de la eliminación
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si el usuario existe
SELECT id, email, name, role, created_at 
FROM users 
WHERE id = '47fd4da7-9b92-4d15-a7e2-d9627299bd41';

-- 2. Verificar tickets asignados al usuario
SELECT id, title, assigned_to, requester_id 
FROM tickets 
WHERE assigned_to = '47fd4da7-9b92-4d15-a7e2-d9627299bd41' 
   OR requester_id = '47fd4da7-9b92-4d15-a7e2-d9627299bd41';

-- 3. Verificar comentarios del usuario
SELECT id, ticket_id, user_id, content 
FROM comments 
WHERE user_id = '47fd4da7-9b92-4d15-a7e2-d9627299bd41';

-- 4. Verificar políticas RLS activas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 5. Verificar si RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- 6. Intentar eliminación manual (descomentar para probar)
-- DELETE FROM users WHERE id = '47fd4da7-9b92-4d15-a7e2-d9627299bd41';

-- 7. Verificar después de eliminación manual
-- SELECT id, email, name, role FROM users WHERE id = '47fd4da7-9b92-4d15-a7e2-d9627299bd41';
