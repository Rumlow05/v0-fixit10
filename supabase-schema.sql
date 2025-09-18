-- Esquema de base de datos para FixIt - Sistema de Tickets
-- Ejecutar este script en Supabase SQL Editor

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de tickets
CREATE TABLE IF NOT EXISTS tickets (
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

-- Tabla de comentarios
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar usuario administrador por defecto
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

-- Insertar usuario de prueba
INSERT INTO users (id, email, name, phone, role, created_at, updated_at)
VALUES (
  'user-2',
  'user@fixit.com',
  'Usuario Test',
  '+573007654321',
  'level1',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insertar algunos tickets de ejemplo
INSERT INTO tickets (id, title, description, priority, status, category, requester_id, created_at, updated_at)
VALUES 
  (
    'ticket-1',
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
    'ticket-2',
    'Solicitud de nuevo usuario',
    'Necesito crear una cuenta para un nuevo empleado',
    'Media',
    'En Progreso',
    'Usuarios',
    'user-2',
    NOW(),
    NOW()
  ),
  (
    'ticket-3',
    'Error en el login',
    'No puedo iniciar sesión con mi cuenta',
    'Alta',
    'Resuelto',
    'Sistema',
    'user-2',
    NOW(),
    NOW()
  );

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_requester_id ON tickets(requester_id);
CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON comments(ticket_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad básicas (permitir todo para desarrollo)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on tickets" ON tickets FOR ALL USING (true);
CREATE POLICY "Allow all operations on comments" ON comments FOR ALL USING (true);
