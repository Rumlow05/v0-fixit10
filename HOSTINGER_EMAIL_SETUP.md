# Configuración de Email con Hostinger

## Pasos para configurar el sistema de notificaciones por correo

### 1. Obtener credenciales de Hostinger

1. Accede a tu panel de control de Hostinger
2. Ve a la sección de **Email**
3. Crea una cuenta de correo para el sistema (ej: `noreply@tudominio.com` o `sistema@tudominio.com`)
4. Anota las credenciales:
   - **Usuario**: tu-email@tudominio.com
   - **Contraseña**: la contraseña que configuraste

### 2. Configurar variables de entorno

1. Crea un archivo `.env` en la raíz del proyecto (si no existe)
2. Copia el contenido de `.env.example` y completa con tus datos:

\`\`\`env
# Gemini AI API Key
GEMINI_API_KEY=tu_clave_gemini_aqui

# Hostinger Email Configuration
HOSTINGER_EMAIL_USER=sistema@tudominio.com
HOSTINGER_EMAIL_PASS=tu_contraseña_email
\`\`\`

### 3. Instalar dependencias

El sistema ya incluye `nodemailer` configurado. Si necesitas instalarlo manualmente:

\`\`\`bash
npm install nodemailer
npm install @types/nodemailer --save-dev
\`\`\`

### 4. Configuración SMTP de Hostinger

El sistema está preconfigurado con:
- **Host**: smtp.hostinger.com
- **Puerto**: 465 (SSL)
- **Seguridad**: SSL/TLS habilitado

### 5. Probar el sistema

1. Inicia la aplicación
2. Ve a la ruta `/api/email/test` (POST)
3. Envía un JSON con tu email para probar:

\`\`\`json
{
  "email": "tu-email@ejemplo.com"
}
\`\`\`

### 6. Funcionalidades disponibles

El sistema enviará emails automáticamente para:

- ✅ **Nuevos usuarios**: Email de bienvenida
- ✅ **Tickets creados**: Notificación a admins y nivel 2
- ✅ **Tickets asignados**: Notificación al usuario asignado
- ✅ **Tickets actualizados**: Notificación al solicitante
- ✅ **Tickets resueltos/cerrados**: Notificación al solicitante

### 7. Solución de problemas

**Error de autenticación:**
- Verifica que las credenciales sean correctas
- Asegúrate de que la cuenta de email esté activa en Hostinger

**Emails no llegan:**
- Revisa la carpeta de spam
- Verifica que el dominio esté configurado correctamente
- Comprueba los logs de la aplicación para errores

**Error de conexión:**
- Verifica que el puerto 465 esté abierto
- Confirma que la configuración SMTP sea correcta

### 8. Personalización

Puedes personalizar las plantillas de email editando el archivo `services/emailService.ts`:
- Cambiar colores y estilos
- Modificar el contenido de los mensajes
- Agregar nuevos tipos de notificaciones
\`\`\`

\`\`\`json file="" isHidden
