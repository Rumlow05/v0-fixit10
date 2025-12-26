# 🤖 Integración Bot WhatsApp con FixIT - Documentación Completa

## 📋 Información Imprescindible para tu Bot

### **1. URL Base del Sistema**
```
URL de Producción: https://dashboard.emprendetucarrera.com.co
Endpoint de Creación: https://dashboard.emprendetucarrera.com.co/api/whatsapp/create-ticket
Método: POST
```

### **2. Autenticación**
```
Tipo: API Key simple
Header: x-api-key: fixit-whatsapp-bot-2024
Alternativo: Authorization: Bearer fixit-whatsapp-bot-2024
```

### **3. Esquema del Payload**

#### **Campos Obligatorios:**
```json
{
  "title": "string (máx 255 caracteres)",
  "description": "string (texto completo del problema)",
  "whatsapp_user_id": "string (remoteJid del usuario)"
}
```

#### **Campos Opcionales:**
```json
{
  "whatsapp_user_name": "string (nombre del usuario si disponible)",
  "priority": "Baja|Media|Alta|Crítica",
  "category": "string (categoría del problema)",
  "ai_summary": "string (resumen generado por Groq)",
  "ai_classification": {
    "priority": "string",
    "category": "string"
  },
  "message_id": "string (ID del mensaje para idempotencia)",
  "timestamp": "string (ISO timestamp)",
  "attachments": [
    {
      "type": "audio|image|document|text",
      "content": "string (transcripción o texto)",
      "url": "string (URL del archivo)",
      "metadata": "object (metadatos adicionales)"
    }
  ]
}
```

### **4. Formato de Respuesta**

#### **Respuesta Exitosa (201):**
```json
{
  "success": true,
  "ticket": {
    "id": "uuid",
    "title": "string",
    "status": "Abierto",
    "priority": "Media",
    "category": "WhatsApp",
    "created_at": "2024-12-26T10:30:00Z",
    "ticket_url": "https://dashboard.emprendetucarrera.com.co/tickets/uuid"
  },
  "message": "Ticket #uuid creado exitosamente",
  "whatsapp_response": "✅ *Ticket Creado*\n\n🎫 *ID:* uuid\n📋 *Título:* ...\n⚡ *Prioridad:* Media\n📊 *Estado:* Abierto\n\nTu solicitud ha sido registrada y será atendida por nuestro equipo de soporte."
}
```

#### **Errores Comunes:**
```json
// 401 - API Key inválida
{
  "error": "API key inválida o faltante",
  "message": "Incluye 'x-api-key' en headers o 'Authorization: Bearer <key>'"
}

// 400 - Campos faltantes
{
  "error": "Campos obligatorios faltantes",
  "required": ["title", "description", "whatsapp_user_id"],
  "received": ["title", "whatsapp_user_id"]
}

// 500 - Error interno
{
  "success": false,
  "error": "Error interno del servidor",
  "message": "No se pudo crear el ticket. Intenta nuevamente.",
  "details": "Error específico"
}
```

### **5. Límites y Políticas**
- **Rate Limit**: Sin límite específico (Vercel maneja automáticamente)
- **Timeout Recomendado**: 30 segundos
- **Tamaño Máximo**: 10MB por request
- **Idempotencia**: Soportada via `message_id`

### **6. Adjuntos**
- ✅ **Acepta transcripciones de audio** como texto en `attachments[].content`
- ✅ **Acepta URLs** de imágenes/documentos en `attachments[].url`
- ✅ **Acepta metadatos** en `attachments[].metadata`
- ❌ **No acepta binarios directos** (usa transcripciones y URLs)

### **7. Valores Válidos**

#### **Estados (automático):**
- `Abierto` (por defecto para tickets nuevos)

#### **Prioridades:**
- `Baja`, `Media`, `Alta`, `Crítica`

#### **Categorías Sugeridas:**
- `Hardware`, `Software`, `Red`, `Solicitud de Acceso`, `WhatsApp`, `Otro`

---

## 🚀 Propuesta de Arquitectura de Integración

### **Integración Directa (RECOMENDADA)**

```javascript
// Ejemplo de implementación en tu bot
const createTicketInVercel = async (ticketData) => {
  try {
    const response = await fetch('https://dashboard.emprendetucarrera.com.co/api/whatsapp/create-ticket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.VERCEL_API_TOKEN
      },
      body: JSON.stringify(ticketData)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      return {
        success: true,
        ticket: result.ticket,
        whatsappMessage: result.whatsapp_response
      }
    } else {
      throw new Error(result.message || 'Error creating ticket')
    }
  } catch (error) {
    console.error('Error creating ticket in Vercel:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
```

---

## 🔧 Variables de Entorno para tu Bot

```env
# Configuración de Vercel FixIT
VERCEL_API_BASE=https://dashboard.emprendetucarrera.com.co/api
VERCEL_API_TOKEN=fixit-whatsapp-bot-2024

# Opcional: Configuración de proxy si es necesario
# SOCKS_PROXY=socks5://proxy:1080
```

---

## 📝 Ejemplo de Payload Completo

```json
{
  "title": "Problema con conexión a internet",
  "description": "No puedo conectarme a internet desde mi computadora, ya reinicié el router pero sigue sin funcionar",
  "whatsapp_user_id": "573001234567@c.us",
  "whatsapp_user_name": "Juan Pérez",
  "priority": "Alta",
  "category": "Red",
  "ai_summary": "Usuario reporta problemas de conectividad. Ya intentó reiniciar router. Posible problema de ISP o configuración de red.",
  "ai_classification": {
    "priority": "Alta",
    "category": "Red"
  },
  "message_id": "3EB0C767D26A1B2E5C6B1E",
  "timestamp": "2024-12-26T15:30:00.000Z",
  "attachments": [
    {
      "type": "audio",
      "content": "Transcripción: Hola, tengo un problema con mi internet, no se conecta desde hace una hora...",
      "metadata": {
        "duration": 15,
        "format": "ogg"
      }
    }
  ]
}
```

---

## 🔄 Flujo Propuesto en tu Bot

### **1. Detección de Disparador**
```javascript
// En tu index.js
if (message.body.toLowerCase().includes('crear ticket') || 
    message.body.toLowerCase().includes('soporte técnico') ||
    message.body.toLowerCase().includes('reportar problema')) {
  
  await handleTicketCreation(message)
}
```

### **2. Procesamiento con IA**
```javascript
// En tu ai.js - Modificar para incluir clasificación
const processTicketWithAI = async (userMessage) => {
  const prompt = `
    Analiza el siguiente mensaje de soporte técnico y genera:
    1. Un título conciso (máx 50 caracteres)
    2. Un resumen técnico
    3. Clasificación de prioridad (Baja/Media/Alta/Crítica)
    4. Categoría (Hardware/Software/Red/Otro)
    
    Mensaje: "${userMessage}"
    
    Responde en formato JSON:
    {
      "title": "...",
      "summary": "...",
      "priority": "...",
      "category": "..."
    }
  `
  
  // Tu lógica de Groq aquí
  return await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama3-8b-8192"
  })
}
```

### **3. Creación de Ticket**
```javascript
const handleTicketCreation = async (message) => {
  try {
    // 1. Procesar con IA
    const aiResponse = await processTicketWithAI(message.body)
    const aiData = JSON.parse(aiResponse.choices[0].message.content)
    
    // 2. Preparar datos del ticket
    const ticketData = {
      title: aiData.title,
      description: message.body,
      whatsapp_user_id: message.from,
      whatsapp_user_name: message._data.notifyName || null,
      priority: aiData.priority,
      category: aiData.category,
      ai_summary: aiData.summary,
      ai_classification: {
        priority: aiData.priority,
        category: aiData.category
      },
      message_id: message.id._serialized,
      timestamp: new Date(message.timestamp * 1000).toISOString(),
      attachments: await processAttachments(message)
    }
    
    // 3. Crear ticket en Vercel
    const result = await createTicketInVercel(ticketData)
    
    // 4. Responder al usuario
    if (result.success) {
      await message.reply(result.whatsappMessage)
    } else {
      await message.reply('❌ Error al crear el ticket. Por favor intenta nuevamente o contacta al soporte.')
    }
    
  } catch (error) {
    console.error('Error handling ticket creation:', error)
    await message.reply('❌ Error interno. Tu mensaje ha sido registrado y será revisado manualmente.')
  }
}
```

### **4. Procesamiento de Adjuntos**
```javascript
const processAttachments = async (message) => {
  const attachments = []
  
  if (message.hasMedia) {
    const media = await message.downloadMedia()
    
    if (media.mimetype.startsWith('audio/')) {
      // Transcribir audio con Groq
      const transcription = await transcribeAudio(media.data)
      attachments.push({
        type: 'audio',
        content: transcription,
        metadata: {
          mimetype: media.mimetype,
          filename: media.filename
        }
      })
    } else if (media.mimetype.startsWith('image/')) {
      // Para imágenes, podrías subirlas a un servicio y guardar la URL
      attachments.push({
        type: 'image',
        content: 'Imagen adjunta por el usuario',
        metadata: {
          mimetype: media.mimetype,
          filename: media.filename
        }
      })
    }
  }
  
  return attachments
}
```

---

## 🧪 Pruebas y Validación

### **1. Prueba Manual con cURL**
```bash
curl -X POST https://dashboard.emprendetucarrera.com.co/api/whatsapp/create-ticket \
  -H "Content-Type: application/json" \
  -H "x-api-key: fixit-whatsapp-bot-2024" \
  -d '{
    "title": "Prueba desde bot",
    "description": "Este es un ticket de prueba desde el bot de WhatsApp",
    "whatsapp_user_id": "573001234567@c.us",
    "whatsapp_user_name": "Usuario Prueba",
    "priority": "Media",
    "category": "Prueba"
  }'
```

### **2. Validación de Respuesta**
- ✅ Status 201 para éxito
- ✅ Campo `ticket.id` presente
- ✅ Campo `whatsapp_response` listo para enviar
- ✅ URL del ticket generada

### **3. Manejo de Errores**
```javascript
const handleApiError = (error, response) => {
  if (response.status === 401) {
    return "🔐 Error de autenticación. Contacta al administrador."
  } else if (response.status === 400) {
    return "📝 Datos incompletos. Asegúrate de describir tu problema."
  } else if (response.status >= 500) {
    return "⚠️ Error del servidor. Intenta nuevamente en unos minutos."
  } else {
    return "❌ Error desconocido. Tu mensaje será revisado manualmente."
  }
}
```

---

## 🔐 Seguridad y Buenas Prácticas

### **1. Configuración Segura**
```javascript
// ✅ Correcto - API key desde variable de entorno
const API_KEY = process.env.VERCEL_API_TOKEN

// ❌ Incorrecto - API key en código
const API_KEY = "fixit-whatsapp-bot-2024"
```

### **2. Idempotencia**
```javascript
// Usar message_id para evitar duplicados
const ticketData = {
  // ... otros campos
  message_id: message.id._serialized, // WhatsApp message ID único
}
```

### **3. Reintentos con Backoff**
```javascript
const createTicketWithRetry = async (ticketData, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await createTicketInVercel(ticketData)
    } catch (error) {
      if (attempt === maxRetries) throw error
      
      // Backoff exponencial: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
```

### **4. Logging y Observabilidad**
```javascript
const logger = require('pino')()

const createTicketInVercel = async (ticketData) => {
  const startTime = Date.now()
  
  try {
    logger.info({ ticketData: { title: ticketData.title, user: ticketData.whatsapp_user_id } }, 'Creating ticket in Vercel')
    
    const result = await fetch(/* ... */)
    
    logger.info({ 
      duration: Date.now() - startTime,
      ticketId: result.ticket?.id 
    }, 'Ticket created successfully')
    
    return result
  } catch (error) {
    logger.error({ 
      error: error.message,
      duration: Date.now() - startTime,
      ticketData: { title: ticketData.title }
    }, 'Error creating ticket')
    
    throw error
  }
}
```

---

## ✅ Checklist de Implementación

### **Configuración Inicial:**
- [ ] Agregar `VERCEL_API_BASE` y `VERCEL_API_TOKEN` al `.env`
- [ ] Instalar dependencias HTTP si no las tienes (`node-fetch` o usar `fetch` nativo)
- [ ] Configurar logging con `pino`

### **Implementación del Cliente:**
- [ ] Crear función `createTicketInVercel()`
- [ ] Implementar manejo de errores y reintentos
- [ ] Agregar validación de respuestas
- [ ] Implementar idempotencia con `message_id`

### **Integración con IA:**
- [ ] Modificar prompt de Groq para incluir clasificación
- [ ] Implementar transcripción de audio
- [ ] Procesar adjuntos (imágenes/documentos)

### **Flujo del Bot:**
- [ ] Detectar disparadores de tickets
- [ ] Integrar procesamiento con IA
- [ ] Implementar creación de tickets remotos
- [ ] Agregar fallback a tickets locales
- [ ] Responder al usuario con confirmación

### **Pruebas:**
- [ ] Probar con cURL manualmente
- [ ] Probar desde el bot en desarrollo
- [ ] Verificar creación de usuarios automática
- [ ] Validar notificaciones por email
- [ ] Probar manejo de errores

---

## 🎯 Resultado Esperado

Una vez implementado, tu bot podrá:

1. **Detectar solicitudes de soporte** automáticamente
2. **Procesar con IA** para clasificar y resumir
3. **Crear tickets en FixIT** automáticamente
4. **Responder al usuario** con confirmación y número de ticket
5. **Manejar errores** graciosamente con fallbacks
6. **Evitar duplicados** usando idempotencia
7. **Transcribir audios** y procesar adjuntos

**¡Tu bot estará completamente integrado con el sistema FixIT en producción!** 🎉
