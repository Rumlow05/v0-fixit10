-- Check the current role constraint on users table
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE t.relname = 'users' 
  AND n.nspname = 'public'
  AND c.contype = 'c';

-- Also check what role values currently exist in the table
SELECT DISTINCT role FROM users;
