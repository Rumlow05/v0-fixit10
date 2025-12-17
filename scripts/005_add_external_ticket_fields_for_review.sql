-- Migration: Add external ticket fields (origin, external_company, external_contact)
-- Safe: checks if columns/constraint/index exist before creating
-- Run in the target database as a superuser or a user with ALTER privileges

BEGIN;

-- 1) Add columns if they do not exist
ALTER TABLE IF EXISTS public.tickets
  ADD COLUMN IF NOT EXISTS origin text DEFAULT 'Interna';

ALTER TABLE IF EXISTS public.tickets
  ADD COLUMN IF NOT EXISTS external_company text;

ALTER TABLE IF EXISTS public.tickets
  ADD COLUMN IF NOT EXISTS external_contact text;

-- 2) Normalize existing rows: set default where NULL
UPDATE public.tickets
  SET origin = 'Interna'
  WHERE origin IS NULL;

-- 3) Add a CHECK constraint for allowed values (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'tickets_origin_check'
      AND t.relname = 'tickets'
  ) THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_origin_check CHECK (origin IN ('Interna', 'Externa'));
  END IF;
END
$$;

-- 4) Create indexes to improve lookup performance (idempotent)
CREATE INDEX IF NOT EXISTS tickets_origin_idx ON public.tickets(origin);
CREATE INDEX IF NOT EXISTS tickets_external_company_idx ON public.tickets(external_company);

-- 5) Add helpful comments to the new columns
COMMENT ON COLUMN public.tickets.origin IS 'Origen del ticket: Interna o Externa';
COMMENT ON COLUMN public.tickets.external_company IS 'Nombre de la empresa aliada (para tickets externos)';
COMMENT ON COLUMN public.tickets.external_contact IS 'Nombre del contacto externo (para tickets externos)';

COMMIT;

-- Verification quick queries (run after migration):
-- SELECT column_name FROM information_schema.columns WHERE table_name='tickets' AND column_name IN ('origin','external_company','external_contact');
-- SELECT origin, external_company, external_contact FROM public.tickets LIMIT 10;
