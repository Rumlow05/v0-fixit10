README — Migración: Agregar campos para tickets externos
===============================================

Propósito
--------
Este README acompaña al script `scripts/005_add_external_ticket_fields_for_review.sql`. El script añade soporte para tickets externos agregando las columnas:

- `origin` (texto) — valores permitidos: 'Interna' o 'Externa' (por defecto 'Interna')
- `external_company` (texto)
- `external_contact` (texto)

El script también normaliza filas existentes, crea un CHECK constraint idempotente, añade índices y comentarios.

Ubicación del script
--------------------
- `scripts/005_add_external_ticket_fields_for_review.sql`

Instrucciones para el jefe (pasos recomendados)
---------------------------------------------
1) Hacer backup de la base de datos (obligatorio):

```bash
pg_dump "$DATABASE_URL" -Fc -f /tmp/backup_before_external_fields.dump
```

2) Revisar el contenido del script si lo desea (por seguridad):
- Abrir `scripts/005_add_external_ticket_fields_for_review.sql` y confirmar que el contenido coincide con la política de la empresa.

3) Ejecutar la migración:

```bash
psql "$DATABASE_URL" -f scripts/005_add_external_ticket_fields_for_review.sql
```

4) Verificar que las columnas fueron creadas:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'tickets'
  AND column_name IN ('origin','external_company','external_contact');
```

5) Verificar datos de ejemplo:

```sql
SELECT origin, external_company, external_contact FROM public.tickets LIMIT 10;
```

Rollback / Revertir (si es necesario)
-----------------------------------
Si por alguna razón se requiere revertir los cambios, ejecutar (después de revisar y validar con el equipo):

```sql
BEGIN;
ALTER TABLE IF EXISTS public.tickets DROP CONSTRAINT IF EXISTS tickets_origin_check;
ALTER TABLE IF EXISTS public.tickets DROP COLUMN IF EXISTS origin;
ALTER TABLE IF EXISTS public.tickets DROP COLUMN IF EXISTS external_company;
ALTER TABLE IF EXISTS public.tickets DROP COLUMN IF EXISTS external_contact;
DROP INDEX IF EXISTS tickets_origin_idx;
DROP INDEX IF EXISTS tickets_external_company_idx;
COMMIT;
```

Notas y precauciones
--------------------
- Ejecutar con un usuario que tenga privilegios de `ALTER TABLE` y `CREATE INDEX`.
- Revisar RLS (Row Level Security) y triggers que puedan depender de la estructura de la tabla `tickets` antes de aplicar la migración en producción.
- El script está pensado para PostgreSQL (Supabase usa PostgreSQL).
- El CHECK constraint se añade de forma segura sólo si no existe un constraint con nombre `tickets_origin_check`.

Contacto y contexto
-------------------
- Script generado desde el repositorio FixIT en `scripts/`.
- El cambio se alinea con la necesidad de distinguir tickets `Interna` / `Externa` y almacenar información del aliado externo.

Sugerencia de mensaje para enviar al equipo (corto)
--------------------------------------------------
Hola,

Adjunto migración para añadir soporte de tickets externos (columnas `origin`, `external_company`, `external_contact`). Favor revisar y aplicar en staging antes de producción. Hice backup como medida preventiva.

Gracias.

---
Archivo: scripts/005_add_external_ticket_fields_for_review.sql
