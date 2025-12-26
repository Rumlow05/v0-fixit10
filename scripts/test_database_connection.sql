-- Script de prueba para verificar que la base de datos funciona correctamente
-- Ejecutar este script en Supabase SQL Editor para verificar la solución

-- 1. Verificar que las tablas existen
SELECT 'Verificando tablas...' as status;
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'tickets', 'ticket_comments', 'attachments')
ORDER BY table_name;

-- 2. Verificar foreign keys en tickets
SELECT 'Verificando foreign keys...' as status;
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'tickets'
  AND tc.table_schema = 'public';

-- 3. Verificar que hay usuarios
SELECT 'Verificando usuarios...' as status;
SELECT id, name, email, role, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Verificar que hay tickets (si los hay)
SELECT 'Verificando tickets...' as status;
SELECT COUNT(*) as total_tickets FROM public.tickets;

-- 5. Probar la consulta que estaba fallando
SELECT 'Probando consulta con relaciones...' as status;
SELECT 
    t.id,
    t.title,
    t.status,
    t.priority,
    t.created_at,
    creator.name as creator_name,
    creator.email as creator_email,
    assigned.name as assigned_name,
    assigned.email as assigned_email
FROM public.tickets t
LEFT JOIN public.users creator ON t.created_by = creator.id
LEFT JOIN public.users assigned ON t.assigned_to = assigned.id
ORDER BY t.created_at DESC
LIMIT 3;

-- 6. Verificar políticas RLS
SELECT 'Verificando políticas RLS...' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('users', 'tickets')
ORDER BY tablename, policyname;

-- 7. Crear un ticket de prueba si no hay ninguno
INSERT INTO public.tickets (
    title, 
    description, 
    priority, 
    status, 
    category, 
    created_by
) 
SELECT 
    'Ticket de Prueba - ' || NOW()::text,
    'Este es un ticket de prueba creado para verificar que la base de datos funciona correctamente.',
    'Media',
    'Abierto',
    'Prueba Sistema',
    u.id
FROM public.users u 
WHERE u.role = 'admin' 
LIMIT 1
ON CONFLICT DO NOTHING;

-- 8. Verificar el ticket recién creado
SELECT 'Verificando ticket de prueba...' as status;
SELECT 
    t.id,
    t.title,
    t.status,
    t.priority,
    creator.name as creator_name
FROM public.tickets t
LEFT JOIN public.users creator ON t.created_by = creator.id
WHERE t.title LIKE 'Ticket de Prueba%'
ORDER BY t.created_at DESC
LIMIT 1;

-- 9. Refrescar cache de esquema
SELECT 'Refrescando cache de esquema...' as status;
NOTIFY pgrst, 'reload schema';

SELECT '✅ Verificación completada. Si ves datos en todas las consultas, la base de datos está funcionando correctamente.' as resultado;
