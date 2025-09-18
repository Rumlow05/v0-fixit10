# Configuración de Supabase para FixIt

## Pasos para configurar la base de datos real

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Espera a que se complete la configuración

### 2. Configurar el esquema de la base de datos

1. En el dashboard de Supabase, ve a **SQL Editor**
2. Copia y pega el contenido del archivo `supabase-schema.sql`
3. Ejecuta el script para crear las tablas y datos iniciales

### 3. Obtener las credenciales

1. En el dashboard de Supabase, ve a **Settings** > **API**
2. Copia los siguientes valores:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

### 4. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=tu_project_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui

# Email Configuration (existing)
HOSTINGER_EMAIL_USER=tu_email@hostinger.com
HOSTINGER_EMAIL_PASS=tu_password_email

# Gemini AI Configuration (existing)
GOOGLE_GENAI_API_KEY=tu_gemini_api_key
```

### 5. Configurar en Vercel

1. Ve a tu proyecto en Vercel
2. Ve a **Settings** > **Environment Variables**
3. Agrega las mismas variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `HOSTINGER_EMAIL_USER`
   - `HOSTINGER_EMAIL_PASS`
   - `GOOGLE_GENAI_API_KEY`

### 6. Verificar la configuración

Una vez configurado, el sistema:
- ✅ Usará Supabase real en lugar del mock client
- ✅ Los datos se sincronizarán entre todos los dispositivos
- ✅ Los usuarios creados en un dispositivo aparecerán en todos los demás
- ✅ La sincronización será instantánea

### 7. Datos iniciales

El script SQL incluye:
- Usuario administrador: `tech@emprendetucarrera.com.co`
- Usuario de prueba: `user@fixit.com`
- 3 tickets de ejemplo
- Esquema completo de la base de datos

### 8. Solución de problemas

Si sigues viendo datos inconsistentes:
1. Verifica que las variables de entorno estén configuradas correctamente
2. Revisa la consola del navegador para ver si dice "Using real Supabase connection"
3. Asegúrate de que el script SQL se ejecutó correctamente en Supabase
4. Verifica que las tablas se crearon en la sección **Table Editor** de Supabase

---

**Una vez configurado, el sistema tendrá sincronización real entre todos los dispositivos.**
