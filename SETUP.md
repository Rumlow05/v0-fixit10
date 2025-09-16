# 🚀 Setup Rápido de FixIT

## ⚡ Para usar HOY mismo:

### 1. **Instalar dependencias**
\`\`\`bash
npm install
\`\`\`

### 2. **Configurar API Key de Gemini**
- Ve a [Google AI Studio](https://aistudio.google.com/)
- Crea una API Key
- Añade la variable de entorno `GEMINI_API_KEY` en la configuración del proyecto
- **Importante:** No uses el prefijo `NEXT_PUBLIC_` para mantener la seguridad

### 3. **Ejecutar la aplicación**
\`\`\`bash
npm run dev
\`\`\`

## 👥 **Usuarios de Prueba Incluidos**

### **Administrador:**
- Email: `alicia@empresa.com`
- Rol: Administrador
- Puede: Gestionar usuarios, asignar tickets, usar IA, generar reportes

### **Técnicos Nivel 1:**
- Email: `beto@empresa.com` o `pedro@empresa.com`
- Rol: Nivel 1
- Pueden: Resolver tickets, transferir a Nivel 2, usar IA

### **Técnicos Nivel 2:**
- Email: `carlos@empresa.com` o `laura@empresa.com`
- Rol: Nivel 2
- Pueden: Resolver tickets complejos, usar IA avanzada

### **Usuarios:**
- Email: `ana@empresa.com` o `maria@empresa.com`
- Rol: Usuario
- Pueden: Crear tickets, ver sus tickets

## 🎯 **Flujo de Trabajo Rápido**

### **Para Administradores:**
1. Login con `alicia@empresa.com`
2. Ir a "Gestionar Usuarios" → "Añadir Nuevo Usuario"
3. Crear usuarios rápidamente (email se genera automáticamente)
4. Asignar tickets desde la vista de tickets

### **Para Usuarios:**
1. Login con su email
2. Click en "+ Nuevo" o "Acciones Rápidas" → "Nuevo Ticket"
3. Usar plantillas rápidas para crear tickets comunes
4. Seguir el progreso en "Mis Tickets"

### **Para Técnicos:**
1. Login con su email técnico
2. Ver todos los tickets asignados
3. Usar IA para sugerencias de solución
4. Resolver o transferir tickets según necesidad

## 🚀 **Funcionalidades Listas para Usar**

✅ **Creación rápida de usuarios** (con email automático)
✅ **Plantillas de tickets** para casos comunes
✅ **Estadísticas en tiempo real**
✅ **Acciones rápidas** desde el sidebar
✅ **IA para sugerencias** (Nivel 1, 2, Admin)
✅ **Asignación de tickets** (Admin)
✅ **Sistema de comentarios**
✅ **Resolución de tickets**
✅ **Transferencia entre niveles**

## 📱 **Acceso Rápido**

- **Local:** http://localhost:5173
- **Email especial:** `tech@emprendetucarrera.com.co` (permite seleccionar cualquier rol)

## 🔧 **Solución de Problemas**

### **Si no funciona la IA:**
- Verifica que tengas la API Key configurada
- Revisa la consola del navegador para errores
- La IA es opcional, el sistema funciona sin ella

### **Si no se guardan los datos:**
- Los datos se guardan en localStorage del navegador
- Para resetear: F12 → Application → Local Storage → Clear

### **Para agregar más usuarios:**
- Login como Admin → Gestionar Usuarios → Añadir Nuevo Usuario
- El email se genera automáticamente basado en el nombre

¡El sistema está listo para usar inmediatamente! 🎉
