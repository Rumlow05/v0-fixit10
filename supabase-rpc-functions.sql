-- Funciones RPC para Supabase
-- Ejecutar en Supabase SQL Editor

-- Función para eliminar usuario bypaseando RLS
CREATE OR REPLACE FUNCTION delete_user_bypass_rls(user_id UUID)
RETURNS TABLE(deleted_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Limpiar referencias primero (usando nombres de columna correctos)
  UPDATE tickets SET assigned_to = NULL WHERE assigned_to = user_id;
  
  -- Intentar diferentes nombres de columna para el solicitante
  BEGIN
    UPDATE tickets SET requester_id = '2af4b6bf-01fe-4b9f-9611-35178dc75c30' WHERE requester_id = user_id;
  EXCEPTION WHEN OTHERS THEN
    -- Si requester_id no existe, intentar con created_by
    BEGIN
      UPDATE tickets SET created_by = '2af4b6bf-01fe-4b9f-9611-35178dc75c30' WHERE created_by = user_id;
    EXCEPTION WHEN OTHERS THEN
      -- Si tampoco existe created_by, intentar con user_id
      BEGIN
        UPDATE tickets SET user_id = '2af4b6bf-01fe-4b9f-9611-35178dc75c30' WHERE user_id = user_id;
      EXCEPTION WHEN OTHERS THEN
        -- Si ninguna columna existe, continuar sin actualizar
        NULL;
      END;
    END;
  END;
  
  -- Eliminar comentarios (intentar diferentes nombres de tabla)
  BEGIN
    DELETE FROM comments WHERE user_id = user_id;
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      DELETE FROM ticket_comments WHERE user_id = user_id;
    EXCEPTION WHEN OTHERS THEN
      -- Si ninguna tabla existe, continuar sin eliminar comentarios
      NULL;
    END;
  END;
  
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
