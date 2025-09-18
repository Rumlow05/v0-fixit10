-- Script para debuggear problemas de eliminación de usuarios
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si hay tickets asignados al usuario que queremos eliminar
SELECT 
  t.id as ticket_id,
  t.title,
  t.assigned_to,
  u.name as assigned_user_name
FROM tickets t
LEFT JOIN users u ON t.assigned_to = u.id
WHERE t.assigned_to = '47fd4da7-9b92-4d15-a7e2-d9627299bd41';

-- 2. Verificar si hay tickets creados por el usuario
SELECT 
  t.id as ticket_id,
  t.title,
  t.requester_id,
  u.name as requester_name
FROM tickets t
LEFT JOIN users u ON t.requester_id = u.id
WHERE t.requester_id = '47fd4da7-9b92-4d15-a7e2-d9627299bd41';

-- 3. Verificar si hay comentarios del usuario
SELECT 
  c.id as comment_id,
  c.content,
  c.user_id,
  u.name as user_name
FROM comments c
LEFT JOIN users u ON c.user_id = u.id
WHERE c.user_id = '47fd4da7-9b92-4d15-a7e2-d9627299bd41';

-- 4. Verificar las restricciones de clave foránea
SELECT 
  tc.table_name,
  tc.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('tickets', 'comments')
  AND ccu.table_name = 'users';

-- 5. Verificar las políticas RLS actuales
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

-- 6. Intentar eliminar el usuario manualmente (para debug)
-- DELETE FROM users WHERE id = '47fd4da7-9b92-4d15-a7e2-d9627299bd41';

-- 7. Si hay restricciones, actualizar los tickets primero
-- UPDATE tickets SET assigned_to = NULL WHERE assigned_to = '47fd4da7-9b92-4d15-a7e2-d9627299bd41';
-- UPDATE tickets SET requester_id = '2af4b6bf-01fe-4b9f-9611-35178dc75c30' WHERE requester_id = '47fd4da7-9b92-4d15-a7e2-d9627299bd41';
-- DELETE FROM comments WHERE user_id = '47fd4da7-9b92-4d15-a7e2-d9627299bd41';
