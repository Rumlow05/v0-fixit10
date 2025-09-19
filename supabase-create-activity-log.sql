-- supabase-create-activity-log.sql
-- Script para crear la tabla de historial de actividad

-- 1. Crear tabla de historial de actividad
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN ('comment', 'assignment', 'status_change', 'creation', 'transfer')),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- 3. Crear política RLS permisiva
CREATE POLICY "Allow all operations on activity_log"
ON activity_log
FOR ALL
TO public, authenticated
USING (true) WITH CHECK (true);

-- 4. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_activity_log_ticket_id ON activity_log(ticket_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(type);

-- 5. Verificar que la tabla fue creada correctamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'activity_log'
ORDER BY ordinal_position;
