-- Insert sample admin user
INSERT INTO public.users (email, name, role, department) 
VALUES ('admin@fixit.com', 'Administrador', 'admin', 'IT')
ON CONFLICT (email) DO NOTHING;

-- Insert sample level1 users
INSERT INTO public.users (email, name, role, department) 
VALUES 
  ('soporte1@fixit.com', 'Soporte Nivel 1', 'level1', 'IT'),
  ('soporte2@fixit.com', 'Soporte Nivel 1 B', 'level1', 'IT')
ON CONFLICT (email) DO NOTHING;

-- Insert sample level2 users
INSERT INTO public.users (email, name, role, department) 
VALUES 
  ('especialista1@fixit.com', 'Especialista Senior', 'level2', 'IT'),
  ('especialista2@fixit.com', 'Especialista Avanzado', 'level2', 'IT')
ON CONFLICT (email) DO NOTHING;
