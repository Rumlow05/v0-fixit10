"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { type Ticket, type User, Role, Status, Priority } from "./types"
import { suggestSolution, generateAdminReport } from "./services/geminiService"

import { userServiceClient } from "./services/userService"
import { ticketServiceClient } from "./services/ticketService"

// --- SVG Icons ---
const IconTickets = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
)
const IconUsers = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
)
const IconLogout = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y2="12" x2="9" y2="12"></line>
  </svg>
)
const IconSpinner = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
)

// --- Mock Data ---
const initialUsers: User[] = [
  { id: 1, name: "Ana Usuario", email: "ana@empresa.com", role: Role.USER },
  { id: 2, name: "Alicia Admin", email: "alicia@empresa.com", role: Role.ADMIN },
  { id: 3, name: "Beto N1", email: "beto@empresa.com", role: Role.LEVEL_1 },
  { id: 4, name: "Carlos N2", email: "carlos@empresa.com", role: Role.LEVEL_2 },
  { id: 5, name: "María Usuario", email: "maria@empresa.com", role: Role.USER },
  { id: 6, name: "Pedro N1", email: "pedro@empresa.com", role: Role.LEVEL_1 },
  { id: 7, name: "Laura N2", email: "laura@empresa.com", role: Role.LEVEL_2 },
]

const initialTickets: Ticket[] = [
  {
    id: 1,
    title: "La impresora no funciona",
    description: 'Mi impresora de red en el segundo piso no imprime. Da un error de "sin papel" pero tiene papel.',
    requesterId: 1,
    assigneeId: 3,
    status: Status.IN_PROGRESS,
    priority: Priority.MEDIUM,
    category: "Hardware",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    comments: [
      { id: 1, author: "Beto N1", text: "Revisando la cola de impresión.", timestamp: new Date().toISOString() },
    ],
  },
  {
    id: 2,
    title: "Necesito acceso a la carpeta de Marketing",
    description: "No puedo acceder a //server/marketing. Necesito acceso de lectura/escritura.",
    requesterId: 1,
    status: Status.OPEN,
    priority: Priority.LOW,
    category: "Solicitud de Acceso",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    comments: [],
  },
  {
    id: 3,
    title: "El sistema CRM está muy lento",
    description: "Desde ayer, cada vez que guardo un cliente nuevo, el sistema tarda casi un minuto en responder.",
    requesterId: 1,
    assigneeId: 4,
    status: Status.IN_PROGRESS,
    priority: Priority.HIGH,
    category: "Software",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    comments: [
      {
        id: 1,
        author: "Alicia Admin",
        text: "Escalado a Nivel 2 para revisión de rendimiento.",
        timestamp: new Date().toISOString(),
      },
    ],
  },
]

// --- Sub-components ---

const LoginScreen = ({
  onLogin,
  onSelectRole,
  showRoleSelection,
  setShowRoleSelection,
  loginEmail,
  setLoginEmail,
  loginError,
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
    <div className="w-full max-w-md p-8 space-y-8 bg-white shadow-2xl rounded-2xl border border-gray-100">
      {showRoleSelection ? (
        <div>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Seleccione un rol</h2>
            <p className="text-gray-600 mt-2">Elija el rol para continuar con la demostración</p>
          </div>
          <div className="space-y-3">
            {Object.values(Role).map((role) => (
              <button
                key={role}
                onClick={() => onSelectRole(role)}
                className="w-full px-6 py-3 text-white font-semibold bg-primary rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Iniciar como {role}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowRoleSelection(false)}
            className="w-full mt-4 px-6 py-3 text-gray-600 font-semibold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Volver
          </button>
        </div>
      ) : (
        <div>
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Bienvenido a FixIT</h2>
            <p className="mt-3 text-gray-600 text-lg">Sistema de gestión de tickets y soporte técnico</p>
          </div>
          <form className="space-y-6" onSubmit={onLogin}>
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                placeholder="tu@empresa.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-600">{loginError}</p>
              </div>
            )}
            <button
              type="submit"
              className="w-full py-3 px-6 border border-transparent text-base font-semibold rounded-xl text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Iniciar Sesión
            </button>
          </form>
        </div>
      )}
    </div>
  </div>
)

const UserManagementModal = ({
  isOpen,
  onClose,
  onSave,
  user,
}: { isOpen: boolean; onClose: () => void; onSave: (user: User) => void; user: User | null }) => {
  const [formData, setFormData] = useState({ id: 0, name: "", email: "", role: Role.USER })

  useEffect(() => {
    setFormData({
      id: user?.id || 0,
      name: user?.name || "",
      email: user?.email || "",
      role: user?.role || Role.USER,
    })
  }, [user, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData as User)
  }

  // Generar email automático basado en el nombre
  const generateEmail = (name: string) => {
    if (!name) return ""
    const cleanName = name
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .replace(/\s+/g, ".")
    return `${cleanName}@empresa.com`
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name: name,
      email: formData.email || generateEmail(name),
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {user ? "Editar Usuario" : "Añadir Nuevo Usuario"}
        </h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre Completo
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              placeholder="Ej: Juan Pérez"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Rol
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
              required
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
            >
              {Object.values(Role).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const TransferToLevel2Modal = ({
  isOpen,
  onClose,
  onTransfer,
  level2Users,
}: { isOpen: boolean; onClose: () => void; onTransfer: (userId: number) => void; level2Users: User[] }) => {
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(level2Users?.[0]?.id)

  useEffect(() => {
    if (isOpen && level2Users?.length > 0 && !selectedUserId) {
      setSelectedUserId(level2Users[0].id)
    }
  }, [isOpen, level2Users, selectedUserId])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedUserId) {
      onTransfer(selectedUserId)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Transferir Ticket a Nivel 2</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="level2-assignee" className="block text-sm font-medium text-gray-700">
              Asignar a:
            </label>
            <select
              id="level2-assignee"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              required
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
            >
              {(level2Users || []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 transition-colors"
            >
              Confirmar Transferencia
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Sidebar = ({ currentUser, currentView, setCurrentView, onLogout, setCreateTicketModalOpen }) => {
  console.log("[v0] Current user in Sidebar:", currentUser)
  console.log("[v0] User role:", currentUser.role)
  console.log("[v0] Is admin?", currentUser.role === Role.ADMIN)

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FixIT</h1>
        </div>
      </div>
      <nav className="flex-grow p-4">
        <div className="space-y-2">
          <button
            onClick={() => setCurrentView("tickets")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all duration-200 ${
              currentView === "tickets" ? "bg-emerald-600 text-white shadow-lg" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <IconTickets /> Tickets
          </button>
          <button
            onClick={() => setCurrentView("resolved")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all duration-200 ${
              currentView === "resolved" ? "bg-emerald-600 text-white shadow-lg" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tickets Resueltos
          </button>
          {currentUser.role === Role.ADMIN && (
            <button
              onClick={() => setCurrentView("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all duration-200 ${
                currentView === "users" ? "bg-emerald-600 text-white shadow-lg" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <IconUsers /> Gestionar Usuarios
            </button>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">Acciones Rápidas</div>
          <button
            onClick={() => setCreateTicketModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-emerald-600 hover:bg-emerald-50 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Ticket
          </button>
        </div>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="font-semibold text-gray-900 text-sm">{currentUser.name}</div>
          <div className="text-xs text-gray-600 mt-1">{currentUser.role}</div>
          <div className="text-xs text-gray-500 mt-1">{currentUser.email}</div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <IconLogout /> Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}

const CreateTicketModal = ({ isOpen, onClose, onCreate, currentUser }) => {
  const [formData, setFormData] = useState({ title: "", description: "", priority: Priority.MEDIUM })
  const [attachments, setAttachments] = useState<File[]>([])

  useEffect(() => {
    if (isOpen) {
      setFormData({ title: "", description: "", priority: Priority.MEDIUM })
      setAttachments([])
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title.trim() && formData.description.trim()) {
      onCreate({ ...formData, attachments })
      onClose()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments((prev) => [...prev, ...newFiles])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  // Plantillas rápidas para tickets comunes
  const quickTemplates = [
    {
      title: "Problema con impresora",
      description: "La impresora no está funcionando correctamente. Describe el problema específico:",
      priority: Priority.MEDIUM,
    },
    {
      title: "Acceso a sistema",
      description: "Necesito acceso a: [especificar sistema/carpeta]. Motivo: [explicar por qué necesitas el acceso]",
      priority: Priority.LOW,
    },
    {
      title: "Sistema lento",
      description:
        "El sistema [nombre del sistema] está funcionando muy lento. Describe cuándo empezó y qué estabas haciendo:",
      priority: Priority.HIGH,
    },
    {
      title: "Error en aplicación",
      description:
        "Error en la aplicación [nombre]. Mensaje de error: [copiar mensaje]. Pasos para reproducir: [describir]",
      priority: Priority.HIGH,
    },
  ]

  const applyTemplate = (template: any) => {
    setFormData({
      title: template.title,
      description: template.description,
      priority: template.priority,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Crear Nuevo Ticket</h3>

        {/* Plantillas rápidas */}
        <div className="mt-4 mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Plantillas Rápidas:</h4>
          <div className="grid grid-cols-2 gap-2">
            {quickTemplates.map((template, index) => (
              <button
                key={index}
                type="button"
                onClick={() => applyTemplate(template)}
                className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-left transition-colors"
              >
                {template.title}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Título
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              placeholder="Describe brevemente el problema"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              placeholder="Proporciona detalles del problema..."
            />
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
              Prioridad
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
            >
              {Object.values(Priority).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adjuntar Archivos</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600 hover:text-blue-500">Cargar archivos</span> o arrastrar y
                  soltar
                </span>
                <span className="text-xs text-gray-500 mt-1">PNG, JPG, PDF hasta 10MB</span>
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Archivos seleccionados:</h5>
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 transition-colors"
            >
              Crear Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const AssignTicketModal = ({ isOpen, onClose, onAssign, users, ticket }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>()

  useEffect(() => {
    if (isOpen) {
      // Si el ticket ya tiene un usuario asignado, mostrarlo como seleccionado
      if (ticket?.assigned_to && users?.length > 0) {
        console.log("[v0] AssignTicketModal - Ticket has assigned user:", ticket.assigned_to)
        setSelectedUserId(ticket.assigned_to)
      } else if (users?.length > 0) {
        // Si no hay usuario asignado, seleccionar el primero disponible
        console.log("[v0] AssignTicketModal - No assigned user, selecting first available:", users[0].id)
      setSelectedUserId(users[0].id)
    }
    }
  }, [isOpen, users, ticket])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedUserId) {
      onAssign(selectedUserId)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Asignar Ticket</h3>
        <p className="mt-2 text-sm text-gray-600">Ticket: {ticket?.title}</p>
        {ticket?.assigned_to && (
          <p className="mt-1 text-sm text-blue-600">
            Actualmente asignado a: {users?.find(u => u.id === ticket.assigned_to)?.name || "Usuario desconocido"}
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="assignee" className="block text-sm font-medium text-gray-700">
              Asignar a:
            </label>
            <select
              id="assignee"
              value={selectedUserId || ""}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
            >
              {(users || []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 transition-colors"
            >
              Asignar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const AddCommentModal = ({ isOpen, onClose, onAddComment, currentUser }) => {
  const [comment, setComment] = useState("")

  useEffect(() => {
    if (isOpen) {
      setComment("")
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (comment.trim()) {
      onAddComment(comment)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Agregar Comentario</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
              Comentario
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              placeholder="Escribe tu comentario..."
            />
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 transition-colors"
            >
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const TicketsView = ({
  tickets,
  users,
  currentUser,
  selectedTicket,
  onSelectTicket,
  onGenerateReport,
  setTransferModalOpen,
  solution,
  isSuggesting,
  report,
  isReporting,
  onCreateTicket,
  onAssignTicket,
  onResolveTicket,
  onAddComment,
  onCreateTicketModalOpen,
  setCreateTicketModalOpen,
  onAssignTicketModalOpen,
  setAssignTicketModalOpen,
  onAddCommentModalOpen,
  setAddCommentModalOpen,
}) => {
  const [isAIAssistantVisible, setIsAIAssistantVisible] = useState(false)
  
  const getUserName = (id: string | undefined) =>
    id ? users.find((u) => u.id === id)?.name || "Desconocido" : "Sin Asignar"
  const isUserRole = currentUser.role === Role.USER
  const canUseAI = [Role.LEVEL_1, Role.LEVEL_2, Role.ADMIN].includes(currentUser.role)
  const canAssign = currentUser.role === Role.ADMIN
  const canResolve = [Role.LEVEL_1, Role.LEVEL_2, Role.ADMIN].includes(currentUser.role)
  const canCreate = true

  // Filtrar tickets activos (excluir resueltos y cerrados)
  const filteredTickets = isUserRole 
    ? tickets.filter((t) => t && t.requesterId === currentUser.id && t.status !== Status.RESOLVED && t.status !== Status.CLOSED)
    : tickets.filter((t) => t && t.status !== Status.RESOLVED && t.status !== Status.CLOSED)
  
  console.log("[v0] MainView - All tickets:", tickets.length)
  console.log("[v0] MainView - Filtered tickets (active only):", filteredTickets.length)
  console.log("[v0] MainView - Tickets by status:", {
    open: tickets.filter(t => t && t.status === Status.OPEN).length,
    inProgress: tickets.filter(t => t && t.status === Status.IN_PROGRESS).length,
    resolved: tickets.filter(t => t && t.status === Status.RESOLVED).length,
    closed: tickets.filter(t => t && t.status === Status.CLOSED).length
  })

  const stats = {
    total: filteredTickets.length,
    open: filteredTickets.filter((t) => t && t.status === Status.OPEN).length,
    inProgress: filteredTickets.filter((t) => t && t.status === Status.IN_PROGRESS).length,
    high: filteredTickets.filter((t) => t && (t.priority === Priority.HIGH || t.priority === Priority.CRITICAL)).length,
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.CRITICAL:
        return "bg-red-100 text-red-800 border-red-200"
      case Priority.HIGH:
        return "bg-orange-100 text-orange-800 border-orange-200"
      case Priority.MEDIUM:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case Priority.LOW:
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.OPEN:
        return "bg-blue-100 text-blue-800 border-blue-200"
      case Status.IN_PROGRESS:
        return "bg-orange-100 text-orange-800 border-orange-200"
      case Status.RESOLVED:
        return "bg-green-100 text-green-800 border-green-200"
      case Status.CLOSED:
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className={`flex-1 grid ${isUserRole ? "grid-cols-7" : (isAIAssistantVisible ? "grid-cols-10" : "grid-cols-7")} h-full overflow-hidden bg-gray-50`}>
      {/* Ticket List */}
      <div className="col-span-3 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{isUserRole ? "Mis Tickets" : "Todos los Tickets"}</h2>
            <div className="flex gap-3">
              {canUseAI && (
                <button
                  onClick={() => setIsAIAssistantVisible(!isAIAssistantVisible)}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
                    isAIAssistantVisible 
                      ? "text-white bg-purple-600 hover:bg-purple-700" 
                      : "text-purple-600 bg-purple-100 hover:bg-purple-200"
                  }`}
                >
                  {isAIAssistantVisible ? "Ocultar IA" : "Mostrar IA"}
                </button>
              )}
              {canCreate && (
                <button
                  onClick={() => setCreateTicketModalOpen(true)}
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  + Nuevo
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
              <div className="text-sm text-blue-700 font-medium">Total</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
              <div className="text-2xl font-bold text-emerald-900">{stats.open}</div>
              <div className="text-sm text-emerald-700 font-medium">Abiertos</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
              <div className="text-2xl font-bold text-orange-900">{stats.inProgress}</div>
              <div className="text-sm text-orange-700 font-medium">En Progreso</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
              <div className="text-2xl font-bold text-red-900">{stats.high}</div>
              <div className="text-sm text-red-700 font-medium">Alta Prioridad</div>
            </div>
          </div>
        </div>
        <div className="p-2">
          {filteredTickets.map((ticket) => 
            ticket ? (
            <div
              key={ticket.id}
              onClick={() => onSelectTicket(ticket)}
              className={`p-4 m-2 rounded-xl cursor-pointer transition-all duration-200 border ${
                selectedTicket?.id === ticket.id
                  ? "bg-primary/5 border-primary shadow-lg"
                  : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">{ticket.title}</h3>
                <span className="text-xs text-gray-500">#{ticket.id}</span>
              </div>
              <div className="flex gap-2 mb-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-lg border ${getPriorityColor(ticket.priority)}`}
                >
                  {ticket.priority}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-lg border ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
              {!isUserRole && <p className="text-xs text-gray-500">Solicitante: {getUserName(ticket.requesterId)}</p>}
            </div>
            ) : null
          )}
        </div>
      </div>

      {/* Ticket Detail */}
      <div className={`col-span-4 overflow-y-auto bg-white ${isUserRole ? "border-r-0" : ""}`}>
        {selectedTicket ? (
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-3xl font-bold text-gray-900 leading-tight">{selectedTicket.title}</h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">#{selectedTicket.id}</span>
              </div>
              <div className="flex gap-3 mb-6">
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-xl border ${getPriorityColor(selectedTicket.priority)}`}
                >
                  {selectedTicket.priority}
                </span>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-xl border ${getStatusColor(selectedTicket.status)}`}
                >
                  {selectedTicket.status}
                </span>
                <span className="px-3 py-1 text-sm font-medium rounded-xl border bg-purple-100 text-purple-800 border-purple-200">
                  {selectedTicket.category}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Descripción</h3>
              <p className="text-gray-700 leading-relaxed">{selectedTicket.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Información del Ticket</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Solicitante:</span>{" "}
                    <span className="font-medium">{getUserName(selectedTicket.requesterId)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Asignado a:</span>{" "}
                    <span className="font-medium">{getUserName(selectedTicket.assigned_to)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Fechas</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Creado:</span>{" "}
                    <span className="font-medium">{new Date(selectedTicket.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Actualizado:</span>{" "}
                    <span className="font-medium">{new Date(selectedTicket.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Historial de Actividad</h4>
                {canResolve && (
                  <button
                    onClick={() => setAddCommentModalOpen(true)}
                    className="px-4 py-2 text-sm font-semibold text-white bg-accent rounded-xl hover:bg-accent/90 transition-all duration-200"
                  >
                    + Comentario
                  </button>
                )}
              </div>
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {(selectedTicket.comments || []).length > 0 ? (
                  (selectedTicket.comments || [])
                    .slice()
                    .reverse()
                    .map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-gray-800 mb-2">{comment.text}</p>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span className="font-medium">{comment.author}</span>
                          <span>{new Date(comment.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg
                      className="w-12 h-12 mx-auto mb-3 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <p>No hay comentarios en este ticket</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-6">
              <h4 className="font-semibold text-gray-900 mb-4">Acciones Disponibles</h4>
              <div className="flex flex-wrap gap-3">
                {canAssign && (
                  <button
                    onClick={() => setAssignTicketModalOpen(true)}
                    className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Asignar Ticket
                  </button>
                )}

                {currentUser.role === Role.LEVEL_1 && selectedTicket.assigned_to === currentUser.id && (
                  <button
                    onClick={() => setTransferModalOpen(true)}
                    className="px-6 py-3 text-sm font-semibold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Transferir a Nivel 2
                  </button>
                )}

                {canResolve && selectedTicket.status !== Status.RESOLVED && selectedTicket.status !== Status.CLOSED && (
                  <button
                    onClick={() => onResolveTicket(selectedTicket.id)}
                    className="px-6 py-3 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Marcar como Resuelto
                  </button>
                )}

                {canResolve && selectedTicket.status === Status.RESOLVED && (
                  <button
                    onClick={() => onResolveTicket(selectedTicket.id, Status.CLOSED)}
                    className="px-6 py-3 text-sm font-semibold text-white bg-gray-600 rounded-xl hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Cerrar Ticket
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500 text-lg">Selecciona un ticket para ver sus detalles</p>
            </div>
          </div>
        )}
      </div>

      {/* AI Panel */}
      {canUseAI && isAIAssistantVisible && (
        <div className="col-span-3 bg-gradient-to-br from-gray-50 to-gray-100 border-l border-gray-200 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Asistente IA</h3>
            </div>

            {selectedTicket && (
              <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Sugerencia de Solución</h4>
                {isSuggesting ? (
                  <div className="flex items-center gap-3 text-gray-500">
                    <IconSpinner />
                    <span>Generando sugerencia...</span>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <pre className="text-sm whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                      {solution || "Selecciona un ticket para obtener una sugerencia de solución"}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {currentUser.role === Role.ADMIN && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-4">Panel de Administración</h4>
                <button
                  onClick={onGenerateReport}
                  disabled={isReporting}
                  className="w-full px-6 py-3 text-white font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:text-gray-200 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  {isReporting ? (
                    <div className="flex items-center justify-center gap-2">
                      <IconSpinner />
                      Generando...
                    </div>
                  ) : (
                    "Generar Informe Ejecutivo"
                  )}
                </button>
                {report && (
                  <div className="mt-4">
                    <h5 className="font-semibold text-gray-900 mb-3">Informe Generado</h5>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <pre className="text-sm whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                        {report}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const UserManagementView = ({
  users,
  currentUser,
  onOpenUserModal,
  onDeleteUser,
  isUserModalOpen,
  onCloseUserModal,
  onSaveUser,
  editingUser,
}) => (
  <div className="flex-1 p-6 overflow-y-auto">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-gray-800">Gestionar Usuarios</h2>
      <button
        onClick={() => onOpenUserModal()}
        className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-colors duration-200 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Crear Nuevo Usuario
      </button>
    </div>
    <div className="bg-white shadow rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correo</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {(users || []).map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button onClick={() => onOpenUserModal(user)} className="text-primary-600 hover:text-primary-900">
                  Editar
                </button>
                <button onClick={() => onDeleteUser(user.id)} className="text-red-600 hover:text-red-900">
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <UserManagementModal isOpen={isUserModalOpen} onClose={onCloseUserModal} onSave={onSaveUser} user={editingUser} />
  </div>
)

const ResolvedTicketsView = ({ tickets, users, currentUser }) => {
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [selectedResponsible, setSelectedResponsible] = useState<string>("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [isResponsibleModalOpen, setIsResponsibleModalOpen] = useState(false)
  const [selectedResponsibleData, setSelectedResponsibleData] = useState<{name: string, id: string, role: string} | null>(null)

  // Filtrar tickets resueltos
  useEffect(() => {
    console.log("[v0] ResolvedTicketsView - All tickets:", tickets)
    console.log("[v0] ResolvedTicketsView - Current user:", currentUser)
    console.log("[v0] ResolvedTicketsView - Status.RESOLVED value:", Status.RESOLVED)
    console.log("[v0] ResolvedTicketsView - Status enum values:", {
      OPEN: Status.OPEN,
      IN_PROGRESS: Status.IN_PROGRESS,
      RESOLVED: Status.RESOLVED,
      CLOSED: Status.CLOSED
    })
    
    // Filtrar por rol: Usuarios solo ven sus propios tickets, otros roles ven todos
    const isUserRole = currentUser.role === Role.USER
    
    // Incluir tanto tickets resueltos como cerrados
    let resolvedTickets = tickets.filter(ticket => {
      const isResolved = ticket && (ticket.status === Status.RESOLVED || ticket.status === Status.CLOSED)
      
      // Si es usuario, solo mostrar sus propios tickets
      if (isUserRole) {
        const isOwnTicket = ticket.requesterId === currentUser.id
        console.log("[v0] ResolvedTicketsView - User role - Checking ticket:", {
          id: ticket?.id,
          title: ticket?.title,
          status: ticket?.status,
          requesterId: ticket?.requesterId,
          currentUserId: currentUser.id,
          isResolved: isResolved,
          isOwnTicket: isOwnTicket
        })
        return isResolved && isOwnTicket
      } else {
        // Otros roles ven todos los tickets resueltos
        console.log("[v0] ResolvedTicketsView - Admin/Technical role - Checking ticket:", {
          id: ticket?.id,
          title: ticket?.title,
          status: ticket?.status,
          isResolved: isResolved
        })
        return isResolved
      }
    })
    console.log("[v0] ResolvedTicketsView - Resolved tickets found:", resolvedTickets.length, resolvedTickets)
    
    // Filtrar por responsable
    if (selectedResponsible !== "all") {
      resolvedTickets = resolvedTickets.filter(ticket => ticket.assigned_to === selectedResponsible)
    }
    
    // Filtrar por fecha
    if (startDate) {
      const start = new Date(startDate)
      resolvedTickets = resolvedTickets.filter(ticket => {
        const ticketDate = new Date(ticket.updated_at || ticket.created_at)
        return ticketDate >= start
      })
    }
    
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // Incluir todo el día
      resolvedTickets = resolvedTickets.filter(ticket => {
        const ticketDate = new Date(ticket.updated_at || ticket.created_at)
        return ticketDate <= end
      })
    }
    
    setFilteredTickets(resolvedTickets)
  }, [tickets, selectedResponsible, startDate, endDate])

  // Obtener estadísticas por responsable
  const getStatsByResponsible = () => {
    const stats: { [key: string]: { name: string; count: number; role: string; id: string } } = {}
    
    filteredTickets.forEach(ticket => {
      if (ticket.assigned_to) {
        const user = users.find(u => u.id === ticket.assigned_to)
        if (user) {
          const key = user.id
          if (!stats[key]) {
            stats[key] = { name: user.name, count: 0, role: user.role, id: user.id }
          }
          stats[key].count++
        }
      }
    })
    
    return Object.values(stats).sort((a, b) => b.count - a.count)
  }

  const getUserName = (id: string | undefined) => {
    if (!id) return "Sin Asignar"
    const user = users.find((u) => u.id === id)
    return user ? user.name : "Desconocido"
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case Role.ADMIN: return "bg-purple-100 text-purple-800"
      case Role.LEVEL_1: return "bg-blue-100 text-blue-800"
      case Role.LEVEL_2: return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const handleResponsibleClick = (responsible: {name: string, id: string, role: string}) => {
    console.log("[v0] handleResponsibleClick - Responsible clicked:", responsible)
    console.log("[v0] handleResponsibleClick - All filtered tickets:", filteredTickets)
    console.log("[v0] handleResponsibleClick - Tickets for this responsible:", filteredTickets.filter(t => t.assigned_to === responsible.id))
    setSelectedResponsibleData(responsible)
    setIsResponsibleModalOpen(true)
  }

  const closeResponsibleModal = () => {
    setIsResponsibleModalOpen(false)
    setSelectedResponsibleData(null)
  }

  const stats = getStatsByResponsible()
  const totalResolved = filteredTickets.length
  const isUserRole = currentUser.role === Role.USER

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tickets Resueltos</h2>
        <p className="text-gray-600">
          {isUserRole 
            ? "Visualiza tus tickets resueltos y cerrados" 
            : "Visualiza y analiza los tickets resueltos por responsable y período"
          }
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
        <div className={`grid grid-cols-1 gap-4 ${isUserRole ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
          {!isUserRole && (
            <div>
              <label htmlFor="responsible" className="block text-sm font-medium text-gray-700 mb-2">
                Responsable
              </label>
              <select
                id="responsible"
                value={selectedResponsible}
                onChange={(e) => setSelectedResponsible(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="all">Todos los responsables</option>
                {users
                  .filter(user => [Role.LEVEL_1, Role.LEVEL_2, Role.ADMIN].includes(user.role))
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              setSelectedResponsible("all")
              setStartDate("")
              setEndDate("")
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className={`grid grid-cols-1 gap-4 mb-6 ${isUserRole ? 'md:grid-cols-2 lg:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {isUserRole ? "Mis Tickets Resueltos" : "Total Resueltos"}
              </p>
              <p className="text-2xl font-semibold text-gray-900">{totalResolved}</p>
            </div>
          </div>
        </div>
        
        {!isUserRole && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Responsables Activos</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.length}</p>
              </div>
            </div>
          </div>
        )}

        {!isUserRole && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Promedio por Responsable</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.length > 0 ? Math.round(totalResolved / stats.length) : 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {!isUserRole && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Mejor Rendimiento</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.length > 0 ? stats[0].name : "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}

        {isUserRole && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tiempo Promedio</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {(() => {
                    if (filteredTickets.length === 0) return "N/A"
                    const totalDays = filteredTickets.reduce((acc, ticket) => {
                      const created = new Date(ticket.created_at)
                      const updated = new Date(ticket.updated_at || ticket.created_at)
                      const diffTime = Math.abs(updated.getTime() - created.getTime())
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                      return acc + diffDays
                    }, 0)
                    return `${Math.round(totalDays / filteredTickets.length)} días`
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ranking de Responsables - Solo para roles técnicos y admin */}
      {!isUserRole && stats.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ranking por Responsable</h3>
          <div className="space-y-3">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                onClick={() => handleResponsibleClick(stat)}
                title="Click para ver tickets resueltos"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{stat.name}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(stat.role)}`}>
                      {stat.role}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">{stat.count}</p>
                  <p className="text-xs text-gray-500">tickets resueltos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Tickets Resueltos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Tickets Resueltos ({totalResolved})</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredTickets.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {isUserRole ? "No tienes tickets resueltos" : "No hay tickets resueltos"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {isUserRole 
                  ? (startDate || endDate 
                      ? "No se encontraron tickets con los filtros aplicados."
                      : "Aún no tienes tickets resueltos o cerrados.")
                  : (selectedResponsible !== "all" || startDate || endDate 
                      ? "No se encontraron tickets con los filtros aplicados."
                      : "Aún no hay tickets resueltos en el sistema.")
                }
              </p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div key={ticket.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">#{ticket.id} - {ticket.title}</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Resuelto
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {!isUserRole && (
                        <>
                          <span>Resuelto por: <span className="font-medium">{getUserName(ticket.assigned_to)}</span></span>
                          <span>•</span>
                        </>
                      )}
                      <span>Resuelto: {formatDate(ticket.updated_at || ticket.created_at)}</span>
                      <span>•</span>
                      <span>Prioridad: <span className="font-medium">{ticket.priority}</span></span>
                      {isUserRole && (
                        <>
                          <span>•</span>
                          <span>Asignado a: <span className="font-medium">{getUserName(ticket.assigned_to)}</span></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Tickets del Responsable */}
      {isResponsibleModalOpen && selectedResponsibleData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Tickets Resueltos - {selectedResponsibleData.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedResponsibleData.role} • {(() => {
                      const countEnum = tickets.filter(t => t && (t.status === Status.RESOLVED || t.status === Status.CLOSED) && t.assigned_to === selectedResponsibleData.id).length
                      const countString = tickets.filter(t => t && (t.status === "Resuelto" || t.status === "Cerrado") && t.assigned_to === selectedResponsibleData.id).length
                      return Math.max(countEnum, countString)
                    })()} tickets resueltos
                  </p>
                </div>
                <button
                  onClick={closeResponsibleModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {(() => {
                // Filtrar todos los tickets resueltos/cerrados del responsable (sin filtros de fecha)
                const responsibleTickets = tickets.filter(ticket => 
                  ticket && 
                  (ticket.status === Status.RESOLVED || ticket.status === Status.CLOSED) &&
                  ticket.assigned_to === selectedResponsibleData.id
                )
                
                // Filtro alternativo usando strings por si hay problema con enums
                const responsibleTicketsAlt = tickets.filter(ticket => 
                  ticket && 
                  (ticket.status === "Resuelto" || ticket.status === "Cerrado") &&
                  ticket.assigned_to === selectedResponsibleData.id
                )
                
                // Usar el filtro que encuentre más tickets
                const finalTickets = responsibleTicketsAlt.length > responsibleTickets.length ? responsibleTicketsAlt : responsibleTickets
                
                return finalTickets.length > 0 ? (
                  <div className="space-y-4">
                    {finalTickets.map((ticket) => (
                      <div key={ticket.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">{ticket.title}</h4>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-3">{ticket.description}</p>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Resuelto: {formatDate(ticket.updated_at || ticket.created_at)}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                Prioridad: <span className="font-medium ml-1">{ticket.priority}</span>
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Status: <span className="font-medium ml-1 text-green-600">{ticket.status}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500">No hay tickets resueltos para este responsable</p>
                  </div>
                )
              })()}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeResponsibleModal}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const App: React.FC = () => {
  // --- State Management ---
  const [users, setUsers] = useState<User[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
    const savedUser = localStorage.getItem("fixit_currentUser")
    return savedUser ? JSON.parse(savedUser) : null
    }
    return null
  })

  const [databaseReady, setDatabaseReady] = useState(false)
  const [showDatabaseSetup, setShowDatabaseSetup] = useState(false)

  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isLoadingTickets, setIsLoadingTickets] = useState(true)

  const [currentView, setCurrentView] = useState<"tickets" | "users" | "resolved">("tickets")
  const [loginEmail, setLoginEmail] = useState("")
  const [loginError, setLoginError] = useState("")
  const [showRoleSelection, setShowRoleSelection] = useState(false)

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  // AI states
  const [solution, setSolution] = useState("")
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [report, setReport] = useState("")
  const [isReporting, setIsReporting] = useState(false)

  // Modal States
  const [isUserModalOpen, setUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isTransferModalOpen, setTransferModalOpen] = useState(false)
  const [isCreateTicketModalOpen, setCreateTicketModalOpen] = useState(false)
  const [isAssignTicketModalOpen, setAssignTicketModalOpen] = useState(false)
  const [isAddCommentModalOpen, setAddCommentModalOpen] = useState(false)

  // --- Effects for Data Persistence ---
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true)
        console.log("[v0] Starting to load users...")
        const fetchedUsers = await userServiceClient.getAllUsers()
        console.log("[v0] Users loaded successfully:", fetchedUsers.length, "users")
        setUsers(fetchedUsers)
        setDatabaseReady(true)
        setShowDatabaseSetup(false)
      } catch (error) {
        console.error("[v0] Error loading users:", error)
        if (
          error?.message?.includes("Could not find the table") ||
          error?.message?.includes("schema cache") ||
          error?.code === "PGRST106"
        ) {
          console.log("[v0] Database tables not found, showing setup screen")
          setShowDatabaseSetup(true)
          setDatabaseReady(false)
        }
        // Keep empty array on error
      } finally {
        setIsLoadingUsers(false)
      }
    }

    loadUsers()
  }, [])

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setIsLoadingTickets(true)
        console.log("[v0] Starting to load tickets...")
        const fetchedTickets = await ticketServiceClient.getAllTickets()
        console.log("[v0] Tickets loaded successfully:", fetchedTickets.length, "tickets")
        console.log("[v0] All loaded tickets:", fetchedTickets)
        setTickets(fetchedTickets)
      } catch (error) {
        console.error("[v0] Error loading tickets:", error)
        // Keep empty array on error
      } finally {
        setIsLoadingTickets(false)
      }
    }

    if (databaseReady) {
      loadTickets()
    }
  }, [databaseReady])

  useEffect(() => {
    if (typeof window !== 'undefined') {
    if (currentUser) {
      localStorage.setItem("fixit_currentUser", JSON.stringify(currentUser))
    } else {
      localStorage.removeItem("fixit_currentUser")
      }
    }
  }, [currentUser])

  // --- Event Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (loginEmail === "tech@emprendetucarrera.com.co") {
      setShowRoleSelection(true)
      setLoginError("")
      return
    }
    const user = users.find((u) => u.email === loginEmail)
    if (user) {
      setCurrentUser(user)
      setLoginError("")
    } else {
      setLoginError("Correo electrónico no encontrado")
    }
  }

  const handleSelectRole = (role: Role) => {
    let userToImpersonate = users.find((u) => u.role === role)

    if (!userToImpersonate) {
      // Create a temporary demo user for the selected role
      userToImpersonate = {
        id: `demo-${role}`,
        name: `Demo ${role}`,
        email: "tech@emprendetucarrera.com.co",
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      console.log("[v0] Created temporary demo user for role:", role)
    }

    setCurrentUser(userToImpersonate)
    setShowRoleSelection(false)
    setLoginError("")
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setSelectedTicket(null)
    setCurrentView("tickets")
    setLoginEmail("")
  }

  const openUserModal = (user?: User) => {
    setEditingUser(user || null)
    setUserModalOpen(true)
  }

  const closeUserModal = () => {
    setUserModalOpen(false)
    setEditingUser(null)
  }

  const openTransferModal = () => {
    setTransferModalOpen(true)
  }

  const closeTransferModal = () => {
    setTransferModalOpen(false)
  }

  const openCreateTicketModal = () => {
    setCreateTicketModalOpen(true)
  }

  const closeCreateTicketModal = () => {
    setCreateTicketModalOpen(false)
  }

  const openAssignTicketModal = () => {
    setAssignTicketModalOpen(true)
  }

  const closeAssignTicketModal = () => {
    setAssignTicketModalOpen(false)
  }

  const openAddCommentModal = () => {
    setAddCommentModalOpen(true)
  }

  const closeAddCommentModal = () => {
    setAddCommentModalOpen(false)
  }

  const handleSelectTicket = async (ticket: Ticket) => {
    if (selectedTicket?.id === ticket.id) {
      setSelectedTicket(null)
      setSolution("")
      return
    }
    setSelectedTicket(ticket)

    // Solo generar sugerencias de IA para roles autorizados
    const canUseAI = currentUser && [Role.LEVEL_1, Role.LEVEL_2, Role.ADMIN].includes(currentUser.role)
    if (canUseAI) {
      setSolution("")
      setIsSuggesting(true)
      try {
        const suggestion = await suggestSolution(ticket.title, ticket.description)
        setSolution(suggestion)
      } catch (error) {
        console.error("Error al obtener la sugerencia:", error)
        setSolution("No se pudo obtener la sugerencia.")
      } finally {
        setIsSuggesting(false)
      }
    }
  }

  const handleGenerateReport = async () => {
    setIsReporting(true)
    setReport("")
    try {
      const adminReport = await generateAdminReport(tickets, users)
      setReport(adminReport)
    } catch (error) {
      console.error("Error al generar el informe:", error)
      setReport("No se pudo generar el informe.")
    } finally {
      setIsReporting(false)
    }
  }

  const sendEmailNotification = async (type: string, ticketData: any, recipientEmail: string, updateType?: string) => {
    try {
      console.log("[v0] Sending email notification:", {
        type,
        recipientEmail,
        ticketData: { ...ticketData, description: ticketData.description?.substring(0, 50) + "..." },
      })

      const response = await fetch("/api/email/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          ticketData,
          recipientEmail,
          updateType,
        }),
      })

      console.log("[v0] Email API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] Email API error response:", errorData)
        throw new Error(`Error ${response.status}: ${errorData.error || "Error al enviar notificación por email"}`)
      }

      const result = await response.json()
      console.log("[v0] Email notification sent successfully:", result.message)
      return true
    } catch (error) {
      console.error("[v0] Error sending email notification:", error)
      // Show user-friendly error message
      if (error instanceof Error) {
        console.error("[v0] Detailed error:", error.message)
      }
      return false
    }
  }

  interface CreateUserData {
    name: string
    email: string
    role: Role
  }

  const handleSaveUser = async (userData: CreateUserData) => {
    try {
      console.log("[v0] Attempting to create user with data:", userData)

      let user: User
      if (editingUser) {
        console.log("[v0] Updating existing user with ID:", editingUser.id)
        user = await userServiceClient.updateUser(editingUser.id, userData)
        setUsers(users.map((u) => (u.id === user.id ? user : u)))
        console.log("[v0] User updated successfully:", user)
      } else {
        console.log("[v0] Creating new user")
        user = await userServiceClient.createUser(userData)
        setUsers([user, ...users])
        console.log("[v0] User created successfully:", user)
      }

      closeUserModal()
      console.log("[v0] User save process completed successfully")
    } catch (error) {
      const errorMessage = error.message || "Error desconocido"

      // Check if it's a validation error (like duplicate email)
      if (errorMessage.includes("Ya existe un usuario") || errorMessage.includes("duplicate")) {
        console.log("[v0] Validation error (not a system error):", errorMessage)
        alert("⚠️ " + errorMessage)
      } else {
        // This is a real system error
        console.error("[v0] System error saving user:", error)
        console.error("[v0] Error details:", {
          message: error.message,
          stack: error.stack,
          userData: userData,
        })
        alert("❌ Error del sistema al guardar usuario: " + errorMessage)
      }
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (currentUser?.id === userId) {
      alert("No puedes eliminar al usuario con el que has iniciado sesión.")
      return
    }
    if (window.confirm("¿Estás seguro de que quieres eliminar a este usuario?")) {
      try {
        console.log("[v0] Starting user deletion for ID:", userId)
        await userServiceClient.deleteUser(userId)
        console.log("[v0] User deleted successfully from database")
        setUsers(users.filter((u) => u.id !== userId))
        console.log("[v0] User removed from local state")
        alert("Usuario eliminado exitosamente")
      } catch (error) {
        console.error("[v0] Error deleting user:", error)
        alert("Error al eliminar usuario. Por favor intenta de nuevo.")
      }
    }
  }

  const handleCreateTicket = async (ticketData: any) => {
    if (!currentUser) return

    try {
      const ticketToCreate = {
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority,
        category: ticketData.category,
        assigned_to: ticketData.assigned_to,
        requesterId: currentUser.id,
      }
      console.log("[v0] handleCreateTicket - Creating ticket with data:", ticketToCreate)
      const newTicket = await ticketServiceClient.createTicket(ticketToCreate)
      console.log("[v0] handleCreateTicket - Created ticket:", newTicket)

      setTickets([newTicket, ...tickets])
      closeCreateTicketModal() // Use the proper function name

      // Send notification email (existing functionality)
      await sendEmailNotification("ticket-created", {
        ticketId: newTicket.id.toString(),
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority,
        status: newTicket.status,
        createdBy: currentUser.name,
        createdAt: newTicket.created_at,
      }, currentUser.email)
    } catch (error) {
      console.error("[v0] Error creating ticket:", error)
      alert("Error al crear ticket. Por favor intenta de nuevo.")
    }
  }

  const handleUpdateTicket = async (ticketId: string, updates: any) => {
    try {
      console.log("[v0] handleUpdateTicket - Updating ticket:", ticketId, "with updates:", updates)
      const updatedTicket = await ticketServiceClient.updateTicket(ticketId, updates)
      console.log("[v0] handleUpdateTicket - Updated ticket received:", updatedTicket)
      console.log("[v0] handleUpdateTicket - Updated ticket status:", updatedTicket?.status, "type:", typeof updatedTicket?.status)
      
      const newTickets = tickets.map((t) => (t && t.id === ticketId ? updatedTicket : t)).filter(t => t)
      console.log("[v0] handleUpdateTicket - New tickets array:", newTickets)
      setTickets(newTickets)

      if (selectedTicket?.id === ticketId) {
        console.log("[v0] handleUpdateTicket - Updating selected ticket:", updatedTicket)
        setSelectedTicket(updatedTicket)
      }
    } catch (error) {
      console.error("[v0] Error updating ticket:", error)
      alert("Error al actualizar ticket. Por favor intenta de nuevo.")
    }
  }

  const handleDeleteTicket = async (ticketId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este ticket?")) {
      try {
        await ticketServiceClient.deleteTicket(ticketId)
        setTickets(tickets.filter((t) => t && t.id !== ticketId))
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(null)
        }
      } catch (error) {
        console.error("[v0] Error deleting ticket:", error)
        alert("Error al eliminar ticket. Por favor intenta de nuevo.")
      }
    }
  }

  const handleAssignTicket = async (assigneeId: string) => {
    if (!selectedTicket) return

    try {
      console.log("[v0] handleAssignTicket - Assigning ticket:", selectedTicket.id, "to user:", assigneeId)
      await handleUpdateTicket(selectedTicket.id, { assigned_to: assigneeId })
      console.log("[v0] handleAssignTicket - Assignment completed, closing modal")
      closeAssignTicketModal()

      // Send notification email
      const assignee = users.find((u) => u.id === assigneeId)
      if (assignee) {
        await sendEmailNotification(
          "ticket-updated",
          {
            ticketId: selectedTicket.id.toString(),
            title: selectedTicket.title,
            description: selectedTicket.description,
            priority: selectedTicket.priority,
            status: selectedTicket.status,
            assignedTo: assignee.name,
            createdBy: users.find(u => u.id === selectedTicket.created_by)?.name || "Desconocido",
            createdAt: selectedTicket.created_at,
          },
          assignee.email,
          "Asignación de ticket"
        )
      }
    } catch (error) {
      console.error("[v0] Error assigning ticket:", error)
      alert("Error al asignar ticket. Por favor intenta de nuevo.")
    }
  }

  const handleResolveTicket = async (ticketId: string, status: Status = Status.RESOLVED) => {
    try {
      console.log("[v0] handleResolveTicket - Resolving ticket:", ticketId, "with status:", status)
      console.log("[v0] handleResolveTicket - Status.RESOLVED value:", Status.RESOLVED)
      await handleUpdateTicket(ticketId, { status })
      console.log("[v0] handleResolveTicket - Ticket resolved successfully")

      // Send notification email
      const ticket = tickets.find((t) => t && t.id === ticketId)
      const requester = users.find((u) => u.id === ticket?.created_by)
      if (ticket && requester) {
        await sendEmailNotification(
          "ticket-updated",
          {
            ticketId: ticket.id.toString(),
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            status: status,
            createdBy: requester.name,
            createdAt: ticket.created_at,
          },
          requester.email,
          "Resolución de ticket"
        )
      }
    } catch (error) {
      console.error("[v0] Error resolving ticket:", error)
      alert("Error al resolver ticket. Por favor intenta de nuevo.")
    }
  }

  const handleAddComment = async (commentText: string) => {
    if (!selectedTicket || !currentUser) return

    try {
      const newComment = {
        id: Date.now(),
        author: currentUser.name,
        text: commentText,
        timestamp: new Date().toISOString(),
      }

      const updatedComments = [...(selectedTicket.comments || []), newComment]
      await handleUpdateTicket(selectedTicket.id, { comments: updatedComments })
      closeAddCommentModal()
    } catch (error) {
      console.error("[v0] Error adding comment:", error)
      alert("Error al agregar comentario. Por favor intenta de nuevo.")
    }
  }

  const handleTransferToLevel2 = async (assigneeId: number) => {
    if (!selectedTicket) return

    try {
      await handleUpdateTicket(selectedTicket.id, {
        assigned_to: assigneeId,
        status: Status.IN_PROGRESS,
      })
      closeTransferModal()

      // Send notification email
      const assignee = users.find((u) => u.id === assigneeId)
      if (assignee) {
        await sendEmailNotification(
          "ticket-updated",
          {
            ticketId: selectedTicket.id.toString(),
            title: selectedTicket.title,
            description: selectedTicket.description,
            priority: selectedTicket.priority,
            status: selectedTicket.status,
            assignedTo: assignee.name,
            createdBy: users.find(u => u.id === selectedTicket.created_by)?.name || "Desconocido",
            createdAt: selectedTicket.created_at,
          },
          assignee.email,
          "Transferencia de ticket a Nivel 2"
        )
      }
    } catch (error) {
      console.error("[v0] Error transferring ticket:", error)
      alert("Error al transferir ticket. Por favor intenta de nuevo.")
    }
  }

  if (isLoadingUsers || isLoadingTickets) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sistema...</p>
        </div>
      </div>
    )
  }

  const level2Users = users.filter((u) => u.role === Role.LEVEL_2)
  const assignableUsers = users.filter((u) => [Role.LEVEL_1, Role.LEVEL_2, Role.ADMIN].includes(u.role))

  if (!currentUser) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onSelectRole={handleSelectRole}
        showRoleSelection={showRoleSelection}
        setShowRoleSelection={setShowRoleSelection}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginError={loginError}
      />
    )
  }

  return (
    <>
      {showDatabaseSetup && (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuración de Base de Datos</h2>
              <p className="text-gray-600 mb-6">
                Las tablas de la base de datos necesitan ser creadas. Por favor, ejecuta el script SQL para configurar
                la base de datos.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Pasos a seguir:</h3>
              <ol className="text-sm text-gray-600 text-left space-y-1">
                <li>1. Ve a la pestaña "Scripts" en v0</li>
                <li>2. Ejecuta el archivo "001_create_all_tables.sql"</li>
                <li>3. Recarga esta página</li>
              </ol>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Recargar Página
            </button>
          </div>
        </div>
      )}

      {!showDatabaseSetup && (
        <div className="h-screen bg-gray-50 flex overflow-hidden">
          <Sidebar
            currentUser={currentUser}
            currentView={currentView}
            setCurrentView={setCurrentView}
            onLogout={handleLogout}
            setCreateTicketModalOpen={openCreateTicketModal}
          />
          {currentView === "tickets" ? (
            <TicketsView
              tickets={tickets}
              users={users}
              currentUser={currentUser}
              selectedTicket={selectedTicket}
              onSelectTicket={handleSelectTicket}
              onGenerateReport={handleGenerateReport}
              setTransferModalOpen={openTransferModal}
              solution={solution}
              isSuggesting={isSuggesting}
              report={report}
              isReporting={isReporting}
              onCreateTicket={handleCreateTicket}
              onAssignTicket={handleAssignTicket}
              onResolveTicket={handleResolveTicket}
              onAddComment={handleAddComment}
              onCreateTicketModalOpen={openCreateTicketModal}
              setCreateTicketModalOpen={setCreateTicketModalOpen}
              onAssignTicketModalOpen={openAssignTicketModal}
              setAssignTicketModalOpen={setAssignTicketModalOpen}
              onAddCommentModalOpen={openAddCommentModal}
              setAddCommentModalOpen={setAddCommentModalOpen}
            />
          ) : currentView === "resolved" ? (
            <ResolvedTicketsView
              tickets={tickets}
              users={users}
              currentUser={currentUser}
            />
          ) : (
            <UserManagementView
              users={users}
              currentUser={currentUser}
              onOpenUserModal={openUserModal}
              onDeleteUser={handleDeleteUser}
              isUserModalOpen={isUserModalOpen}
              onCloseUserModal={closeUserModal}
              onSaveUser={handleSaveUser}
              editingUser={editingUser}
            />
          )}

          {/* Modals */}
          <TransferToLevel2Modal
            isOpen={isTransferModalOpen}
            onClose={closeTransferModal}
            onTransfer={handleTransferToLevel2}
            level2Users={level2Users}
          />
          <CreateTicketModal
            isOpen={isCreateTicketModalOpen}
            onClose={closeCreateTicketModal}
            onCreate={handleCreateTicket}
            currentUser={currentUser}
          />
          <AssignTicketModal
            isOpen={isAssignTicketModalOpen}
            onClose={closeAssignTicketModal}
            onAssign={handleAssignTicket}
            users={assignableUsers}
            ticket={selectedTicket}
          />
          <AddCommentModal
            isOpen={isAddCommentModalOpen}
            onClose={closeAddCommentModal}
            onAddComment={handleAddComment}
            currentUser={currentUser}
          />
        </div>
      )}
    </>
  )
}

export default App

const Database = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
  </svg>
)
