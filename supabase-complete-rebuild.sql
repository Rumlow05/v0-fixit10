-- SCRIPT COMPLETO DE RECONSTRUCCIÓN DE BASE DE DATOS
-- Ejecutar en Supabase SQL Editor
-- ⚠️ ADVERTENCIA: Este script eliminará y recreará las tablas

-- 1. ELIMINAR TABLAS EXISTENTES (en orden correcto por dependencias)
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS ticket_comments CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. CREAR TABLA USERS CON ESTRUCTURA CORRECTA
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREAR TABLA TICKETS CON ESTRUCTURA CORRECTA
CREATE TABLE tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  priority VARCHAR(50) NOT NULL DEFAULT 'Media',
  status VARCHAR(50) NOT NULL DEFAULT 'Abierto',
  category VARCHAR(100),
  assigned_to UUID REFERENCES users(id),
  requester_id UUID REFERENCES users(id) NOT NULL,
  transferred_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREAR TABLA COMMENTS CON ESTRUCTURA CORRECTA
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CREAR ÍNDICES PARA MEJOR RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_requester_id ON tickets(requester_id);
CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON comments(ticket_id);

-- 6. HABILITAR ROW LEVEL SECURITY
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 7. CREAR POLÍTICAS RLS PERMISIVAS
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on tickets" ON tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on comments" ON comments FOR ALL USING (true) WITH CHECK (true);

-- 8. INSERTAR USUARIO ADMINISTRADOR POR DEFECTO
INSERT INTO users (id, email, name, phone, role, created_at, updated_at)
VALUES (
  '2af4b6bf-01fe-4b9f-9611-35178dc75c30',
  'tech@emprendetucarrera.com.co',
  'Administrador',
  '+573001234567',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 9. INSERTAR USUARIO DE PRUEBA
INSERT INTO users (id, email, name, phone, role, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'user@fixit.com',
  'Usuario Test',
  '+573007654321',
  'user',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 10. INSERTAR TICKETS DE EJEMPLO
INSERT INTO tickets (id, title, description, priority, status, category, requester_id, created_at, updated_at)
VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'Problema con el sistema de correo',
    'No puedo enviar correos desde la aplicación',
    'Alta',
    'Abierto',
    'Sistema',
    '2af4b6bf-01fe-4b9f-9611-35178dc75c30',
    NOW(),
    NOW()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'Solicitud de nuevo usuario',
    'Necesito crear una cuenta para un nuevo empleado',
    'Media',
    'En Progreso',
    'Usuarios',
    '550e8400-e29b-41d4-a716-446655440001',
    NOW(),
    NOW()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    'Error en el login',
    'No puedo iniciar sesión con mi cuenta',
    'Alta',
    'Resuelto',
    'Sistema',
    '550e8400-e29b-41d4-a716-446655440001',
    NOW(),
    NOW()
  );

-- 11. VERIFICAR QUE TODO SE CREÓ CORRECTAMENTE
SELECT 'Users created:' as info, COUNT(*) as count FROM users;
SELECT 'Tickets created:' as info, COUNT(*) as count FROM tickets;
SELECT 'Comments created:' as info, COUNT(*) as count FROM comments;

-- 12. MOSTRAR ESTRUCTURA DE LAS TABLAS
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('users', 'tickets', 'comments')
ORDER BY table_name, ordinal_position;

-- 13. MOSTRAR POLÍTICAS RLS
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
WHERE tablename IN ('users', 'tickets', 'comments')
ORDER BY tablename, policyname;
