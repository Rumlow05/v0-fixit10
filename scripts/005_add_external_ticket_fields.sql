-- Add columns for external tickets support
ALTER TABLE IF EXISTS public.tickets 
ADD COLUMN IF NOT EXISTS origin text check (origin in ('Interna', 'Externa')) DEFAULT 'Interna',
ADD COLUMN IF NOT EXISTS external_company text,
ADD COLUMN IF NOT EXISTS external_contact text;

-- Create indexes for better performance on external tickets queries
CREATE INDEX IF NOT EXISTS tickets_origin_idx ON public.tickets(origin);
CREATE INDEX IF NOT EXISTS tickets_external_company_idx ON public.tickets(external_company);

-- Add comment documenting the change
COMMENT ON COLUMN public.tickets.origin IS 'Origen del ticket: Interna o Externa';
COMMENT ON COLUMN public.tickets.external_company IS 'Nombre de la empresa aliada (para tickets externos)';
COMMENT ON COLUMN public.tickets.external_contact IS 'Nombre del contacto externo (para tickets externos)';
