-- Crear tabla de attachments para tickets
-- Ejecutar en Supabase SQL Editor

-- Tabla de attachments
CREATE TABLE IF NOT EXISTS attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones (ajustar según necesidades de seguridad)
CREATE POLICY "Allow all operations on attachments" 
  ON attachments FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_attachments_ticket_id ON attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_attachments_created_at ON attachments(created_at);

-- Comentarios de la tabla
COMMENT ON TABLE attachments IS 'Almacena archivos adjuntos de tickets';
COMMENT ON COLUMN attachments.ticket_id IS 'ID del ticket al que pertenece el archivo';
COMMENT ON COLUMN attachments.filename IS 'Nombre del archivo en el servidor';
COMMENT ON COLUMN attachments.original_name IS 'Nombre original del archivo subido por el usuario';
COMMENT ON COLUMN attachments.file_size IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN attachments.file_type IS 'Tipo MIME del archivo';
COMMENT ON COLUMN attachments.file_path IS 'Ruta donde se almacena el archivo';
COMMENT ON COLUMN attachments.uploaded_by IS 'Usuario que subió el archivo';
