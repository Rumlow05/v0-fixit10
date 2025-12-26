-- Script para corregir las relaciones de la base de datos
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Primero, verificar si las tablas existen
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'tickets')
ORDER BY table_name, ordinal_position;

-- 2. Verificar las foreign keys existentes
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name = 'tickets';

-- 3. Eliminar constraints existentes si hay problemas (solo si es necesario)
-- ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_created_by_fkey;
-- ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_assigned_to_fkey;

-- 4. Recrear la tabla tickets con la estructura correcta
DROP TABLE IF EXISTS public.tickets CASCADE;

CREATE TABLE public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('Baja', 'Media', 'Alta', 'Crítica', 'Urgente')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('Abierto', 'En Progreso', 'Resuelto', 'Cerrado')),
    category VARCHAR(100) NOT NULL,
    origin VARCHAR(20) DEFAULT 'Interna' CHECK (origin IN ('Interna', 'Externa')),
    external_company VARCHAR(255),
    external_contact VARCHAR(255),
    created_by UUID NOT NULL,
    assigned_to UUID,
    transferred_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    -- Foreign key constraints
    CONSTRAINT fk_tickets_created_by 
        FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_tickets_assigned_to 
        FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT fk_tickets_transferred_by 
        FOREIGN KEY (transferred_by) REFERENCES public.users(id) ON DELETE SET NULL
);

-- 5. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON public.tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON public.tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON public.tickets(category);

-- 6. Habilitar Row Level Security
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas RLS permisivas
DROP POLICY IF EXISTS "Allow all operations on tickets" ON public.tickets;
CREATE POLICY "Allow all operations on tickets" 
    ON public.tickets FOR ALL 
    USING (true)
    WITH CHECK (true);

-- 8. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Crear trigger para updated_at
DROP TRIGGER IF EXISTS tickets_updated_at ON public.tickets;
CREATE TRIGGER tickets_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 10. Insertar algunos tickets de prueba
INSERT INTO public.tickets (
    title, 
    description, 
    priority, 
    status, 
    category, 
    created_by,
    assigned_to
) 
SELECT 
    'Ticket de prueba - ' || u1.name,
    'Descripción del ticket de prueba creado por ' || u1.name,
    'Media',
    'Abierto',
    'Soporte Técnico',
    u1.id,
    u2.id
FROM 
    (SELECT id, name FROM public.users WHERE role = 'admin' LIMIT 1) u1,
    (SELECT id, name FROM public.users WHERE role IN ('level1', 'level2') LIMIT 1) u2
ON CONFLICT DO NOTHING;

-- 11. Verificar que todo esté funcionando
SELECT 
    t.id,
    t.title,
    t.status,
    t.priority,
    creator.name as creator_name,
    assigned.name as assigned_name
FROM public.tickets t
LEFT JOIN public.users creator ON t.created_by = creator.id
LEFT JOIN public.users assigned ON t.assigned_to = assigned.id
LIMIT 5;

-- 12. Refrescar el cache de esquema de Supabase
NOTIFY pgrst, 'reload schema';
