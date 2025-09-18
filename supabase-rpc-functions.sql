-- Funciones RPC para Supabase
-- Ejecutar en Supabase SQL Editor

-- Función para eliminar usuario bypaseando RLS
CREATE OR REPLACE FUNCTION delete_user_bypass_rls(user_id UUID)
RETURNS TABLE(deleted_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Limpiar referencias primero
  UPDATE tickets SET assigned_to = NULL WHERE assigned_to = user_id;
  UPDATE tickets SET requester_id = '2af4b6bf-01fe-4b9f-9611-35178dc75c30' WHERE requester_id = user_id;
  DELETE FROM comments WHERE user_id = user_id;
  
  -- Eliminar el usuario
  DELETE FROM users WHERE id = user_id;
  
  -- Retornar el ID eliminado
  RETURN QUERY SELECT user_id;
END;
$$;

-- Función para verificar si un usuario existe
CREATE OR REPLACE FUNCTION user_exists(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM users WHERE id = user_id);
END;
$$;

-- Función para obtener estadísticas de un usuario
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS TABLE(
  total_tickets BIGINT,
  assigned_tickets BIGINT,
  created_tickets BIGINT,
  comments_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM tickets WHERE assigned_to = user_id OR requester_id = user_id) as total_tickets,
    (SELECT COUNT(*) FROM tickets WHERE assigned_to = user_id) as assigned_tickets,
    (SELECT COUNT(*) FROM tickets WHERE requester_id = user_id) as created_tickets,
    (SELECT COUNT(*) FROM comments WHERE user_id = user_id) as comments_count;
END;
$$;
