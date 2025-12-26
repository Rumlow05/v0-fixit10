# 🎯 Endpoint de Asignación de Tickets - Bot WhatsApp

## 📋 Información del Endpoint

### **URL y Método**
```
URL: https://dashboard.emprendetucarrera.com.co/api/whatsapp/assign-ticket
Método: POST
Content-Type: application/json
```

### **Autenticación**
```
Header: x-api-key: fixit-whatsapp-bot-2024
Alternativo: Authorization: Bearer fixit-whatsapp-bot-2024
```

## 📝 Estructura del Payload

### **Campos Obligatorios**
```json
{
  "ticket_id": "string (UUID del ticket a asignar)",
  "assignee_email": "string (email del usuario asignador)"
}
```

### **Ejemplo de Request**
```json
{
  "ticket_id": "7038e101-e09a-4b29-83f5-ee6ccdfeee9b",
  "assignee_email": "tech@emprendetucarrera.com.co"
}
```

## 📊 Respuestas del Endpoint

### **✅ Éxito (200 OK)**
```json
{
  "success": true,
  "message": "Ticket asignado exitosamente",
  "ticket": {
    "id": "7038e101-e09a-4b29-83f5-ee6ccdfeee9b",
    "title": "Problema con internet",
    "status": "En Progreso",
    "priority": "Media",
    "assigned_to": "Johan David Rincón Malaver",
    "assigned_email": "tech@emprendetucarrera.com.co",
    "updated_at": "2025-12-26T18:30:00.000Z",
    "ticket_url": "https://dashboard.emprendetucarrera.com.co/tickets/7038e101-e09a-4b29-83f5-ee6ccdfeee9b"
  },
  "whatsapp_response": "✅ *Ticket Asignado*\n\n🎫 *ID:* 7038e101-e09a-4b29-83f5-ee6ccdfeee9b\n📋 *Título:* Problema con internet\n👤 *Asignado a:* Johan David Rincón Malaver\n📊 *Estado:* En Progreso\n⚡ *Prioridad:* Media\n\nEl ticket ha sido asignado exitosamente y el técnico ha sido notificado."
}
```

### **❌ Errores Comunes**

#### **401 - API Key Inválida**
```json
{
  "success": false,
  "error": "API key inválida o faltante",
  "message": "Incluye 'x-api-key' en headers o 'Authorization: Bearer <key>'"
}
```

#### **400 - Campos Faltantes**
```json
{
  "success": false,
  "error": "Campos obligatorios faltantes",
  "message": "ticket_id y assignee_email son requeridos",
  "required": ["ticket_id", "assignee_email"],
  "received": ["ticket_id"]
}
```

#### **400 - Email Inválido**
```json
{
  "success": false,
  "error": "Email inválido",
  "message": "El formato del email 'email-invalido' no es válido"
}
```

#### **404 - Ticket No Encontrado**
```json
{
  "success": false,
  "error": "Ticket no encontrado",
  "message": "No se encontró un ticket con ID: ticket-inexistente"
}
```

#### **404 - Usuario No Encontrado**
```json
{
  "success": false,
  "error": "Usuario asignador no encontrado",
  "message": "No se encontró un usuario registrado con el email: usuario@inexistente.com",
  "suggestion": "Verifica que el usuario esté registrado en el sistema FixIT"
}
```

#### **500 - Error Interno**
```json
{
  "success": false,
  "error": "Error interno del servidor",
  "message": "No se pudo asignar el ticket. Intenta nuevamente.",
  "details": "Detalles específicos del error"
}
```

## 🔧 Implementación en el Bot

### **Ejemplo de Código JavaScript**
```javascript
const assignTicket = async (ticketId, assigneeEmail) => {
  try {
    const response = await fetch(`${process.env.VERCEL_API_BASE}/whatsapp/assign-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.VERCEL_API_TOKEN
      },
      body: JSON.stringify({
        ticket_id: ticketId,
        assignee_email: assigneeEmail
      })
    })
    
    const result = await response.json()
    
    if (response.ok && result.success) {
      return {
        success: true,
        ticket: result.ticket,
        whatsappMessage: result.whatsapp_response
      }
    } else {
      throw new Error(result.message || 'Error asignando ticket')
    }
  } catch (error) {
    console.error('Error assigning ticket:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Uso en el bot
const result = await assignTicket("ticket-id-123", "tech@emprendetucarrera.com.co")
if (result.success) {
  await message.reply(result.whatsappMessage)
} else {
  await message.reply(`❌ Error: ${result.error}`)
}
```

### **Ejemplo con cURL**
```bash
curl -X POST https://dashboard.emprendetucarrera.com.co/api/whatsapp/assign-ticket \
  -H "Content-Type: application/json" \
  -H "x-api-key: fixit-whatsapp-bot-2024" \
  -d '{
    "ticket_id": "7038e101-e09a-4b29-83f5-ee6ccdfeee9b",
    "assignee_email": "tech@emprendetucarrera.com.co"
  }'
```

## 🎯 Funcionalidades Implementadas

### **✅ Validaciones**
- ✅ **Autenticación**: Valida API key
- ✅ **Campos obligatorios**: ticket_id y assignee_email
- ✅ **Formato de email**: Validación con regex
- ✅ **Existencia de ticket**: Verifica que el ticket exista
- ✅ **Existencia de usuario**: Verifica que el email esté registrado

### **✅ Funcionalidades**
- ✅ **Asignación de ticket**: Actualiza assigned_to con el ID del usuario
- ✅ **Cambio de estado**: Cambia automáticamente a "En Progreso"
- ✅ **Notificación por email**: Envía email al usuario asignado
- ✅ **Respuesta formateada**: Campo whatsapp_response listo para usar
- ✅ **Información completa**: Retorna datos actualizados del ticket

### **✅ Manejo de Errores**
- ✅ **Errores descriptivos**: Mensajes claros para cada tipo de error
- ✅ **Códigos HTTP apropiados**: 200, 400, 401, 404, 500
- ✅ **Logging completo**: Logs para debugging
- ✅ **Fallback de notificaciones**: No falla si el email no se puede enviar

## 🔄 Flujo Completo

### **1. Bot recibe comando de asignación**
```
Usuario: "Asignar ticket #123 a tech@emprendetucarrera.com.co"
```

### **2. Bot procesa y envía request**
```javascript
const result = await assignTicket("123", "tech@emprendetucarrera.com.co")
```

### **3. API procesa la asignación**
- Valida autenticación ✅
- Verifica que el ticket existe ✅
- Verifica que el usuario existe ✅
- Asigna el ticket ✅
- Cambia estado a "En Progreso" ✅
- Envía notificación por email ✅

### **4. Bot responde al usuario**
```
✅ *Ticket Asignado*

🎫 *ID:* 123
📋 *Título:* Problema con internet
👤 *Asignado a:* Johan David Rincón Malaver
📊 *Estado:* En Progreso
⚡ *Prioridad:* Media

El ticket ha sido asignado exitosamente y el técnico ha sido notificado.
```

## 📋 Variables de Entorno

### **Para el Bot (sin cambios)**
```env
VERCEL_API_BASE=https://dashboard.emprendetucarrera.com.co/api
VERCEL_API_TOKEN=fixit-whatsapp-bot-2024
```

## 🎉 Resumen

**El endpoint `/whatsapp/assign-ticket` está completamente implementado y listo para usar:**

- ✅ **URL**: `https://dashboard.emprendetucarrera.com.co/api/whatsapp/assign-ticket`
- ✅ **Método**: `POST`
- ✅ **Autenticación**: `x-api-key: fixit-whatsapp-bot-2024`
- ✅ **Payload**: `{ ticket_id, assignee_email }`
- ✅ **Respuesta**: JSON con `success` y `whatsapp_response`
- ✅ **Validaciones**: Completas y robustas
- ✅ **Notificaciones**: Email automático al asignado
- ✅ **Manejo de errores**: Completo y descriptivo

**¡El bot ya puede asignar tickets automáticamente!** 🚀
