-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'level1', 'level2')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('baja', 'media', 'alta', 'critica')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('abierto', 'en_progreso', 'resuelto', 'cerrado')),
    category VARCHAR(100) NOT NULL,
    created_by UUID REFERENCES public.users(id),
    assigned_to UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ticket comments table
CREATE TABLE IF NOT EXISTS public.ticket_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert themselves" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update themselves" ON public.users FOR UPDATE USING (true);

-- Create policies for tickets table
CREATE POLICY "Users can view all tickets" ON public.tickets FOR SELECT USING (true);
CREATE POLICY "Users can create tickets" ON public.tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update tickets" ON public.tickets FOR UPDATE USING (true);

-- Create policies for ticket comments table
CREATE POLICY "Users can view all comments" ON public.ticket_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.ticket_comments FOR INSERT WITH CHECK (true);

-- Insert sample admin user
INSERT INTO public.users (email, name, role) 
VALUES ('admin@fixit.com', 'Administrador', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample level1 users
INSERT INTO public.users (email, name, role) 
VALUES 
    ('soporte1@fixit.com', 'Soporte Nivel 1', 'level1'),
    ('soporte2@fixit.com', 'Soporte Nivel 1', 'level1')
ON CONFLICT (email) DO NOTHING;

-- Insert sample level2 users
INSERT INTO public.users (email, name, role) 
VALUES 
    ('especialista1@fixit.com', 'Especialista Nivel 2', 'level2'),
    ('especialista2@fixit.com', 'Especialista Nivel 2', 'level2')
ON CONFLICT (email) DO NOTHING;
