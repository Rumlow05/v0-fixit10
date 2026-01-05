# 🔐 Configuración de Login con Google OAuth 2.0

Esta guía te ayudará a configurar el inicio de sesión con Google en FixIT usando OAuth 2.0 (el método actual y recomendado).

## 📋 Requisitos Previos

- Cuenta de Google (Gmail o Google Workspace)
- Proyecto en Supabase configurado
- Acceso al dashboard de Supabase

## 🚀 Pasos de Configuración

### Paso 1: Configurar Google Cloud Console

1. **Accede a Google Cloud Console**
   - Ve a [console.cloud.google.com](https://console.cloud.google.com)
   - Inicia sesión con tu cuenta de Google

2. **Crea o Selecciona un Proyecto**
   - Haz clic en el selector de proyectos (arriba a la izquierda)
   - Haz clic en "New Project" o selecciona uno existente
   - Asigna un nombre al proyecto (ej: "FixIT Auth")
   - Haz clic en "Create"

3. **Configura la Pantalla de Consentimiento OAuth**
   - En el menú lateral, ve a **"APIs & Services"** > **"OAuth consent screen"**
   - Selecciona el tipo de usuario:
     - **External**: Para usuarios fuera de tu organización (desarrollo/público)
     - **Internal**: Solo para usuarios de tu Google Workspace
   - Completa la información requerida:
     - **App name**: FixIT (o el nombre que prefieras)
     - **User support email**: Tu email de soporte
     - **Developer contact information**: Tu email
   - Haz clic en "Save and Continue"
   - En "Scopes", no necesitas agregar nada adicional para login básico
   - En "Test users" (solo si es External), puedes agregar emails de prueba
   - Revisa y finaliza la configuración

4. **Crea las Credenciales OAuth 2.0**
   - Ve a **"APIs & Services"** > **"Credentials"**
   - Haz clic en **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
   - Si es la primera vez, se te pedirá configurar la pantalla de consentimiento (ya lo hiciste en el paso 3)
   - Selecciona **"Web application"** como tipo de aplicación
   - Asigna un nombre (ej: "FixIT Web Client")
   - En **"Authorized redirect URIs"**, agrega:
     ```
     https://[tu-proyecto].supabase.co/auth/v1/callback
     ```
     ⚠️ **IMPORTANTE**: Debes usar el callback de Supabase, NO el de tu aplicación.
     Para encontrar tu URL de Supabase:
     - Ve a tu proyecto en Supabase Dashboard
     - Ve a Settings > API
     - La URL de tu proyecto será algo como: `https://abcdefghijklmnop.supabase.co`
     - El redirect_uri será: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`
     
     Ejemplo real:
     ```
     https://nypgidkcccagsdsgissl.supabase.co/auth/v1/callback
     ```
   - Haz clic en **"Create"**
   - **IMPORTANTE**: Copia el **Client ID** y **Client Secret** (solo se muestran una vez)

### Paso 2: Configurar Supabase

1. **Accede a tu Dashboard de Supabase**
   - Ve a [supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecciona tu proyecto

2. **Habilita el Provider de Google**
   - En el menú lateral, ve a **"Authentication"** > **"Providers"**
   - Busca **"Google"** en la lista de providers
   - Habilita el toggle de Google
   - Ingresa las credenciales:
     - **Client ID (for OAuth)**: Pega el Client ID de Google Cloud Console
     - **Client Secret (for OAuth)**: Pega el Client Secret de Google Cloud Console
   - Haz clic en **"Save"**

3. **Verifica la Configuración**
   - Asegúrate de que el provider esté habilitado (toggle verde)
   - Verifica que las credenciales estén guardadas correctamente

### Paso 3: Configurar Variables de Entorno (Opcional)

Si necesitas configuraciones adicionales, puedes agregarlas en `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Para desarrollo
# En producción, usar: https://tu-dominio.com
```

### Paso 4: Probar el Login

1. **Inicia tu aplicación**
   ```bash
   npm run dev
   # o
   pnpm dev
   ```

2. **Prueba el login**
   - Ve a la página de login
   - Haz clic en "Continuar con Google"
   - Deberías ser redirigido a Google para autenticarte
   - Después de autenticarte, serás redirigido de vuelta a la aplicación
   - Si el usuario no existe, se creará automáticamente con rol "Usuario"

## 🔍 Solución de Problemas

### Error: "redirect_uri_mismatch"
- **Causa**: La URL de callback no coincide con la configurada en Google Cloud Console
- **Solución**: ⚠️ **DEBES usar el callback de Supabase**, NO el de tu aplicación:
  - La URL correcta es: `https://[tu-proyecto].supabase.co/auth/v1/callback`
  - Para encontrar tu URL de Supabase: Ve a Settings > API en tu dashboard de Supabase
  - Ejemplo: `https://nypgidkcccagsdsgissl.supabase.co/auth/v1/callback`
  - Asegúrate de incluir el protocolo `https://` y no agregar barras finales
  - **NO uses** `http://localhost:3000/api/auth/callback` en Google Cloud Console

### Error: "invalid_client"
- **Causa**: Las credenciales (Client ID o Client Secret) son incorrectas
- **Solución**: Verifica que hayas copiado correctamente el Client ID y Client Secret en Supabase

### El botón de Google no aparece
- **Causa**: Posible error en el código o variables de entorno
- **Solución**: 
  - Verifica que las rutas `/api/auth/google` y `/api/auth/callback` existan
  - Revisa la consola del navegador para ver errores
  - Asegúrate de que Supabase esté configurado correctamente

### Usuario creado pero no puede iniciar sesión
- **Causa**: El usuario se creó pero hay un problema con la sesión
- **Solución**: 
  - Verifica que el usuario exista en la tabla `users` de Supabase
  - Revisa los logs de la consola del navegador
  - Intenta cerrar sesión y volver a iniciar sesión

## 📝 Notas Importantes

1. **Rol por Defecto**: Los usuarios que se registran por primera vez con Google obtienen el rol "Usuario" por defecto. Un administrador puede cambiar este rol después.

2. **Producción**: 
   - Asegúrate de agregar la URL de producción en Google Cloud Console
   - Verifica que `NEXT_PUBLIC_APP_URL` esté configurado correctamente
   - Considera usar un dominio personalizado en Supabase si es necesario

3. **Seguridad**:
   - Nunca compartas tu Client Secret públicamente
   - Mantén las credenciales en variables de entorno
   - Usa HTTPS en producción

4. **Límites de Google OAuth**:
   - Para aplicaciones "External" en modo testing, solo puedes agregar hasta 100 usuarios de prueba
   - Para producción, necesitas verificar tu aplicación con Google

## 🔗 Enlaces Útiles

- [Google Cloud Console](https://console.cloud.google.com)
- [Documentación de OAuth 2.0 de Google](https://developers.google.com/identity/protocols/oauth2)
- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Dashboard](https://supabase.com/dashboard)

---

**Última actualización**: 2025-01-XX
**Método**: OAuth 2.0 (actual y recomendado)

