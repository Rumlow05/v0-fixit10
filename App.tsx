"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { type Ticket, type User, Role, Status, Priority } from "./types"
import { suggestSolution, generateAdminReport } from "./services/geminiService"

import { userServiceClient } from "./services/userService"
import { ticketServiceClient } from "./services/ticketServiceClient"
import { attachmentServiceClient } from "./services/attachmentService"
import { syncService, createUserEvent, createTicketEvent } from "./services/syncService"
import { useNotifications } from "./hooks/useNotifications"
import NotificationContainer from "./components/NotificationContainer"
import AttachmentViewer from "./components/AttachmentViewer"
import { activityService, createActivityEvents } from "./services/activityService"
import DarkModeToggle from "./components/DarkModeToggle"

// --- Funciones de formateo de fecha/hora para Colombia ---
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })
}

const formatOnlyDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
}

const getColombiaTimestampLocal = () => {
  const now = new Date()
  // Convertir a zona horaria de Colombia y luego a ISO string
  const colombiaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Bogota" }))
  return colombiaTime.toISOString()
}

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
    <line x1="21" y1="12" x2="9" y2="12"></line>
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

// Los datos se cargan desde el mock client en lib/supabase/client.ts
// No hay datos iniciales duplicados aquí

// --- Sub-components ---

interface LoginScreenProps {
  onSendCode: (email: string) => Promise<void>
  onVerifyCode: (email: string, code: string) => Promise<void>
  onGoogleLogin: () => void
  onSelectRole: (role: Role) => void
  showRoleSelection: boolean
  setShowRoleSelection: (show: boolean) => void
  loginEmail: string
  setLoginEmail: (email: string) => void
  loginError: string
  loginStep: 'email' | 'code'
  setLoginStep: (step: 'email' | 'code') => void
  verificationCode: string
  setVerificationCode: (code: string) => void
  isSendingCode: boolean
  codeSent: boolean
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  onSendCode,
  onVerifyCode,
  onGoogleLogin,
  onSelectRole,
  showRoleSelection,
  setShowRoleSelection,
  loginEmail,
  setLoginEmail,
  loginError,
  loginStep,
  setLoginStep,
  verificationCode,
  setVerificationCode,
  isSendingCode,
  codeSent,
}) => {
  // Manejar envío de código (paso 1: email)
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSendCode(loginEmail)
  }

  // Manejar verificación de código (paso 2: código)
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    await onVerifyCode(loginEmail, verificationCode)
  }

  return (
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
              {loginStep === 'email' ? (
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
              ) : (
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              )}
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Bienvenido a FixIT</h2>
            <p className="mt-3 text-gray-600 text-lg">
              {loginStep === 'email' 
                ? 'Sistema de gestión de tickets y soporte técnico'
                : 'Ingresa el código de verificación'}
            </p>
          </div>

          {loginStep === 'email' ? (
            <form className="space-y-6" onSubmit={handleSendCode}>
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
                  disabled={isSendingCode}
                />
              </div>
              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-600">{loginError}</p>
                </div>
              )}
              {codeSent && !loginError && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm text-green-600">
                    Se ha enviado un código de verificación a tu correo electrónico.
                  </p>
                </div>
              )}
              <button
                type="submit"
                disabled={isSendingCode}
                className="w-full py-3 px-6 border border-transparent text-base font-semibold rounded-xl text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSendingCode ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando código...
                  </>
                ) : (
                  'Enviar código de verificación'
                )}
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyCode}>
              <div>
                <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-2">
                  Código de verificación
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Ingresa el código de 6 dígitos que enviamos a <strong>{loginEmail}</strong>
                </p>
                <input
                  id="verification-code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setVerificationCode(value)
                  }}
                />
              </div>
              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-600">{loginError}</p>
                </div>
              )}
              <div className="space-y-3">
                <button
                  type="submit"
                  className="w-full py-3 px-6 border border-transparent text-base font-semibold rounded-xl text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Verificar código
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setLoginStep('email')
                    setVerificationCode('')
                    setCodeSent(false)
                    await onSendCode(loginEmail)
                  }}
                  className="w-full py-2 px-6 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Reenviar código
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginStep('email')
                    setVerificationCode('')
                    setCodeSent(false)
                  }}
                  className="w-full py-2 px-6 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cambiar correo electrónico
                </button>
              </div>
            </form>
          )}

          {/* Solo mostrar opción de Google en el paso de email */}
          {loginStep === 'email' && (
            <>
              {/* Separador */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">O continúa con</span>
                </div>
              </div>
              
              {/* Botón de Google */}
              <button
                type="button"
                onClick={onGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3 px-6 border-2 border-gray-300 rounded-xl text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  </div>
  )
}

const UserManagementModal = ({
  isOpen,
  onClose,
  onSave,
  user,
}: { isOpen: boolean; onClose: () => void; onSave: (user: User) => void; user: User | null }) => {
  const [formData, setFormData] = useState({ id: "", name: "", email: "", phone: "", role: Role.USER })

  useEffect(() => {
    setFormData({
      id: user?.id || "",
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
          {user ? "Editar Usuario" : "Añadir Nuevo Usuario"}
        </h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre Completo
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ej: Juan Pérez"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Número de Teléfono
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ej: +57 300 123 4567"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rol
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
              required
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
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
}: { isOpen: boolean; onClose: () => void; onTransfer: (userId: string) => void; level2Users: User[] }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(level2Users?.[0]?.id)

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
              onChange={(e) => setSelectedUserId(e.target.value)}
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

interface SidebarProps {
  currentUser: User | null
  currentView: string
  setCurrentView: (view: string) => void
  onLogout: () => void
  setCreateTicketModalOpen: (open: boolean) => void
  setIsWhatsAppAdminOpen: (open: boolean) => void
  isSyncing: boolean
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, currentView, setCurrentView, onLogout, setCreateTicketModalOpen, setIsWhatsAppAdminOpen, isSyncing }) => {
  console.log("[v0] Current user in Sidebar:", currentUser)
  console.log("[v0] User role:", currentUser?.role)
  console.log("[v0] Is admin?", currentUser?.role === Role.ADMIN)

  return (
    <aside className="w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-lg">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FixIT</h1>
            {isSyncing && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-3 h-3 border-2 border-gray-300 dark:border-gray-600 border-t-emerald-600 rounded-full animate-spin"></div>
                <span>Sincronizando...</span>
              </div>
            )}
          </div>
          <DarkModeToggle size="sm" />
        </div>
      </div>
      <nav className="flex-grow p-4">
        <div className="space-y-2">
          <button
            onClick={() => setCurrentView("tickets")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all duration-200 ${
              currentView === "tickets" ? "bg-emerald-600 text-white shadow-lg" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <IconTickets /> Tickets
          </button>
          <button
            onClick={() => setCurrentView("resolved")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all duration-200 ${
              currentView === "resolved" ? "bg-emerald-600 text-white shadow-lg" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tickets Resueltos
          </button>
          {currentUser?.role === Role.ADMIN && (
            <button
              onClick={() => setCurrentView("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all duration-200 ${
                currentView === "users" ? "bg-emerald-600 text-white shadow-lg" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <IconUsers /> Gestionar Usuarios
            </button>
          )}

          {/* Botón de WhatsApp solo para tech@emprendetucarrera.com.co */}
          {currentUser?.email === "tech@emprendetucarrera.com.co" && (
            <button
              onClick={() => setIsWhatsAppAdminOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              WhatsApp Admin
            </button>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-4">Acciones Rápidas</div>
          <button
            onClick={() => setCreateTicketModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Ticket
          </button>
        </div>
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
          <div className="font-semibold text-gray-900 dark:text-white text-sm">{currentUser?.name}</div>
          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">{currentUser?.role}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{currentUser?.email}</div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
        >
          <IconLogout /> Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}

interface CreateTicketModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (ticketData: any) => void
  currentUser: User | null
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ isOpen, onClose, onCreate, currentUser }) => {
  const [formData, setFormData] = useState({ 
    title: "", 
    description: "", 
    priority: Priority.MEDIUM,
    origin: 'Interna' as 'Interna' | 'Externa',
    external_company: "",
    external_contact: "",
    requester_id: "" // ID del usuario seleccionado cuando es interna
  })
  const [attachments, setAttachments] = useState<File[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Cargar usuarios cuando el modal se abre y el origen es interna (para personal TIC)
  useEffect(() => {
    if (isOpen && currentUser && currentUser.role !== Role.USER && formData.origin === 'Interna') {
      loadUsers()
    }
  }, [isOpen, formData.origin, currentUser])

  // Cargar usuarios del sistema
  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const users = await userServiceClient.getAllUsers()
      setAvailableUsers(users)
    } catch (error) {
      console.error("[CreateTicketModal] Error loading users:", error)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      setFormData({ 
        title: "", 
        description: "", 
        priority: Priority.MEDIUM,
        origin: 'Interna' as 'Interna' | 'Externa',
        external_company: "",
        external_contact: "",
        requester_id: ""
      })
      setAttachments([])
      setAvailableUsers([])
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
      if (formData.title.trim() && formData.description.trim()) {
      // Validar campos condicionales para tickets externos
      if (formData.origin === 'Externa' && (!formData.external_company?.trim() || !formData.external_contact?.trim())) {
        alert("Por favor completa el nombre del aliado y el solicitante")
        return
      }
      // Validar que se haya seleccionado un solicitante cuando es interna y es personal TIC
      if (currentUser && currentUser.role !== Role.USER && formData.origin === 'Interna' && !formData.requester_id) {
        alert("Por favor selecciona un solicitante")
        return
      }
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
      ...formData,
      title: template.title,
      description: template.description,
      priority: template.priority,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg sm:text-xl font-medium leading-6 text-gray-900 dark:text-white mb-4">Crear Nuevo Ticket</h3>

        {/* Plantillas rápidas */}
        <div className="mt-3 sm:mt-4 mb-4">
          <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Plantillas Rápidas:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickTemplates.map((template, index) => (
              <button
                key={index}
                type="button"
                onClick={() => applyTemplate(template)}
                className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-left transition-colors text-gray-700 dark:text-gray-300"
              >
                {template.title}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Clasificación (Origen del ticket) - Solo para Admin, Nivel 1 y Nivel 2 */}
          {currentUser && currentUser.role !== Role.USER && (
            <div>
              <label htmlFor="origin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Clasificación (Origen)
              </label>
              <select
                id="origin"
                value={formData.origin}
                onChange={(e) => {
                  const newOrigin = e.target.value as 'Interna' | 'Externa'
                  setFormData({ 
                    ...formData, 
                    origin: newOrigin,
                    external_company: newOrigin === 'Interna' ? "" : formData.external_company,
                    external_contact: newOrigin === 'Interna' ? "" : formData.external_contact,
                    requester_id: newOrigin === 'Externa' ? "" : formData.requester_id
                  })
                  // Si cambia a interna, cargar usuarios
                  if (newOrigin === 'Interna') {
                    loadUsers()
                  }
                }}
                className="mt-1 block w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              >
                <option value="Interna">Interna</option>
                <option value="Externa">Externa</option>
              </select>
            </div>
          )}

          {/* Campos condicionales para tickets externos - Solo para Admin, Nivel 1 y Nivel 2 */}
          {currentUser && currentUser.role !== Role.USER && (
            <>
              {formData.origin === 'Externa' ? (
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg p-3 sm:p-4">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">Información del Aliado Externo</h4>
                <div className="mb-3">
                  <label htmlFor="external_company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre del Aliado
                  </label>
                  <input
                    type="text"
                    id="external_company"
                    value={formData.external_company}
                    onChange={(e) => setFormData({ ...formData, external_company: e.target.value })}
                    required
                    className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Ej: TecnoGlobal"
                  />
                </div>

                <div>
                  <label htmlFor="external_contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Solicitante
                  </label>
                  <input
                    type="text"
                    id="external_contact"
                    value={formData.external_contact}
                    onChange={(e) => setFormData({ ...formData, external_contact: e.target.value })}
                    required
                    className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Ej: Carlos Ruiz"
                  />
                </div>
                </div>
              ) : (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 rounded-lg p-3 sm:p-4">
                  <h4 className="text-sm font-semibold text-green-900 dark:text-green-200 mb-3">Solicitante Interno</h4>
                  <div>
                    <label htmlFor="requester_select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Seleccionar Usuario del Sistema
                    </label>
                    {loadingUsers ? (
                      <div className="mt-1 block w-full px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                        Cargando usuarios...
                      </div>
                    ) : (
                      <select
                        id="requester_select"
                        value={formData.requester_id}
                        onChange={(e) => setFormData({ ...formData, requester_id: e.target.value })}
                        required
                        className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      >
                        <option value="">-- Selecciona un usuario --</option>
                        {availableUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Título
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="mt-1 block w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Describe brevemente el problema"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Descripción
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              className="mt-1 block w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Proporciona detalles del problema..."
            />
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Prioridad
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
              className="mt-1 block w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {Object.values(Priority).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Sección de archivos adjuntos deshabilitada temporalmente */}
          {/* 
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
          */}

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="order-2 sm:order-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors w-full sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="order-1 sm:order-2 px-6 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 transition-colors w-full sm:w-auto"
            >
              Crear Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface AssignTicketModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (userId: string) => void
  users: User[]
  ticket: Ticket | null
}

const AssignTicketModal: React.FC<AssignTicketModalProps> = ({ isOpen, onClose, onAssign, users, ticket }) => {
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

const ChangePriorityModal = ({
  isOpen,
  onClose,
  onPriorityChange,
  currentPriority,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onPriorityChange: (priority: Priority) => void;
  currentPriority: Priority;
}) => {
  const [selectedPriority, setSelectedPriority] = useState<Priority>(currentPriority)

  useEffect(() => {
    if (isOpen) {
      setSelectedPriority(currentPriority)
    }
  }, [isOpen, currentPriority])

  if (!isOpen) return null

  console.log("[v0] ChangePriorityModal is open, currentPriority:", currentPriority)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onPriorityChange(selectedPriority)
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.LOW:
        return "bg-green-100 text-green-800 border-green-200"
      case Priority.MEDIUM:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case Priority.HIGH:
        return "bg-red-100 text-red-800 border-red-200"
      case Priority.CRITICAL:
        return "bg-red-200 text-red-900 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Cambiar Prioridad del Ticket</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona la nueva prioridad:
            </label>
            <div className="space-y-2">
              {Object.values(Priority).map((priority) => (
                <label key={priority} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="priority"
                    value={priority}
                    checked={selectedPriority === priority}
                    onChange={(e) => setSelectedPriority(e.target.value as Priority)}
                    className="mr-3"
                  />
                  <span className={`px-3 py-1 text-sm font-medium rounded-lg border ${getPriorityColor(priority)}`}>
                    {priority}
                  </span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Cambiar Prioridad
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const ResolutionModal = ({
  isOpen,
  onClose,
  onResolve,
  ticketTitle,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onResolve: (resolutionMessage: string, wasResolved: boolean) => void;
  ticketTitle: string;
}) => {
  const [resolutionMessage, setResolutionMessage] = useState("")
  const [wasResolved, setWasResolved] = useState<boolean | null>(null)

  useEffect(() => {
    if (isOpen) {
      setResolutionMessage("")
      setWasResolved(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (resolutionMessage.trim() && wasResolved !== null) {
      onResolve(resolutionMessage.trim(), wasResolved)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          Resolver Ticket: {ticketTitle}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿Se pudo resolver el problema?
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="resolved"
                  value="yes"
                  checked={wasResolved === true}
                  onChange={() => setWasResolved(true)}
                  className="mr-2"
                />
                <span className="text-green-600 font-medium">✅ Sí, se resolvió</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="resolved"
                  value="no"
                  checked={wasResolved === false}
                  onChange={() => setWasResolved(false)}
                  className="mr-2"
                />
                <span className="text-red-600 font-medium">❌ No se pudo resolver</span>
              </label>
            </div>
          </div>
          
          <div>
            <label htmlFor="resolution-message" className="block text-sm font-medium text-gray-700 mb-2">
              Describe qué sucedió y la solución aplicada:
            </label>
            <textarea
              id="resolution-message"
              value={resolutionMessage}
              onChange={(e) => setResolutionMessage(e.target.value)}
              placeholder="Ejemplo: Se identificó que el problema era... Se aplicó la siguiente solución... El usuario confirmó que funciona correctamente."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={4}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!resolutionMessage.trim() || wasResolved === null}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Marcar como Resuelto
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const DeleteTicketModal = ({
  isOpen,
  onClose,
  onDelete,
  ticketTitle,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onDelete: (deleteMessage: string) => void;
  ticketTitle: string;
}) => {
  const [deleteMessage, setDeleteMessage] = useState("")

  useEffect(() => {
    if (isOpen) {
      setDeleteMessage("")
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (deleteMessage.trim()) {
      onDelete(deleteMessage.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          🗑️ Eliminar Ticket: {ticketTitle}
        </h3>
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            <strong>⚠️ Advertencia:</strong> Esta acción eliminará permanentemente el ticket. 
            El usuario solicitante será notificado del motivo de la eliminación.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="delete-message" className="block text-sm font-medium text-gray-700 mb-2">
              Motivo de la eliminación (obligatorio):
            </label>
            <textarea
              id="delete-message"
              value={deleteMessage}
              onChange={(e) => setDeleteMessage(e.target.value)}
              placeholder="Ejemplo: El ticket fue eliminado porque la solicitud no cumple con las políticas de soporte técnico. El problema reportado no está relacionado con el área de TI."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={4}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!deleteMessage.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Eliminar Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const WhatsAppAdminPanel = ({
  isOpen,
  onClose,
  qrCode,
  status,
  onConnect,
  onDisconnect,
}: {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string | null;
  status: {isConnected: boolean, needsQR: boolean};
  onConnect: () => void;
  onDisconnect: () => void;
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            📱 Administración de WhatsApp
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Estado de disponibilidad */}
          {false && (
            <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="font-medium text-yellow-800">No Disponible</span>
              </div>
              <p className="text-sm text-yellow-700">
                WhatsApp solo está disponible en desarrollo local. En producción, las notificaciones se envían únicamente por email.
              </p>
            </div>
          )}

          {/* Estado de conexión */}
          {true && (
            <div className="p-4 rounded-lg border">
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${status.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">
                  {status.isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {status.isConnected 
                  ? 'WhatsApp está conectado y listo para enviar notificaciones'
                  : 'WhatsApp no está conectado. Conecta para enviar notificaciones'
                }
              </p>
            </div>
          )}

          {/* QR Code */}
          {qrCode && !status.isConnected && (
            <div className="text-center">
              <h4 className="font-medium mb-2">Escanea este código QR con WhatsApp:</h4>
              <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
                <img 
                  src={qrCode} 
                  alt="WhatsApp QR Code" 
                  className="mx-auto max-w-full h-auto"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                1. Abre WhatsApp en tu teléfono<br/>
                2. Ve a Configuración → Dispositivos vinculados<br/>
                3. Toca "Vincular un dispositivo"<br/>
                4. Escanea este código QR
              </p>
            </div>
          )}

          {/* Controles */}
          <div className="flex space-x-3">
            {!status.isConnected ? (
              <button
                onClick={onConnect}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Conectar WhatsApp
              </button>
            ) : (
              <button
                onClick={onDisconnect}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Desconectar WhatsApp
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
          </div>

          {/* Información adicional */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p><strong>Nota:</strong> Una vez conectado, WhatsApp enviará automáticamente notificaciones a los usuarios que tengan número de teléfono registrado.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface AddCommentModalProps {
  isOpen: boolean
  onClose: () => void
  onAddComment: (comment: string) => void
  currentUser: User | null
}

const AddCommentModal: React.FC<AddCommentModalProps> = ({ isOpen, onClose, onAddComment, currentUser }) => {
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

interface TicketsViewProps {
  tickets: Ticket[]
  users: User[]
  currentUser: User | null
  selectedTicket: Ticket | null
  onSelectTicket: (ticket: Ticket) => void
  onGenerateReport: () => void
  setTransferModalOpen: (open: boolean) => void
  solution: string
  isSuggesting: boolean
  report: string
  isReporting: boolean
  onCreateTicket: (ticketData: any) => void
  onAssignTicket: (userId: string) => void
  onResolveTicket: (ticketId: string, status: Status) => void
  onAddComment: (comment: string) => void
  onCreateTicketModalOpen: boolean
  setCreateTicketModalOpen: (open: boolean) => void
  onAssignTicketModalOpen: boolean
  setAssignTicketModalOpen: (open: boolean) => void
  setPriorityModalOpen: (open: boolean) => void
  onAddCommentModalOpen: boolean
  setAddCommentModalOpen: (open: boolean) => void
  setResolutionModalOpen: (open: boolean) => void
  setDeleteModalOpen: (open: boolean) => void
  isAttachmentViewerOpen: boolean
  setAttachmentViewerOpen: (open: boolean) => void
  ticketActivities: any[]
}

const TicketsView: React.FC<TicketsViewProps> = ({
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
  setPriorityModalOpen,
  onAddCommentModalOpen,
  setAddCommentModalOpen,
  setResolutionModalOpen,
  setDeleteModalOpen,
  isAttachmentViewerOpen,
  setAttachmentViewerOpen,
  ticketActivities,
}) => {
  const [isAIAssistantVisible, setIsAIAssistantVisible] = useState(false)
  
  // Función para obtener el nombre del usuario, con mejor manejo para tickets internos
  // Asegura que siempre muestre el nombre del solicitante cuando el ticket es interno
  const getUserName = (id: string | undefined, ticket?: Ticket) => {
    if (!id) return "Sin Asignar"
    
    // Primero, buscar en la lista de usuarios cargada
    const user = users.find((u: User) => u.id === id)
    if (user?.name) return user.name
    
    // Si no se encuentra y tenemos el ticket, buscar en la relación creator (desde la BD)
    // Esto es útil cuando los datos vienen con relaciones cargadas
    if (ticket) {
      // Buscar por creator si está disponible
      if ((ticket as any).creator?.name) {
        // Verificar que el creator coincida con el ID buscado
        const creatorId = (ticket as any).creator?.id || (ticket as any).created_by
        if (creatorId === id) {
          return (ticket as any).creator.name
        }
      }
      
      // También verificar si el requester_id del ticket coincide y tiene creator
      if (ticket.requester_id === id && (ticket as any).creator?.name) {
        return (ticket as any).creator.name
      }
    }
    
    // Si no encontramos el ticket actual, buscar en otros tickets
    const foundTicket = tickets.find((t: Ticket) => {
      if (!t) return false
      // Buscar por requester_id o created_by
      if (t.requester_id === id || (t as any).created_by === id) {
        return true
      }
      return false
    })
    
    if (foundTicket && (foundTicket as any).creator?.name) {
      return (foundTicket as any).creator.name
    }
    
    // Si aún no se encuentra, devolver "Desconocido" en lugar de N/A
    // Esto asegura que siempre haya un valor legible
    return "Desconocido"
  }
  const isUserRole = currentUser?.role === Role.USER
  const canUseAI = currentUser ? [Role.LEVEL_1, Role.LEVEL_2, Role.ADMIN].includes(currentUser.role) : false
  // Permitir que Nivel 1, Nivel 2 y Admin puedan asignar tickets
  const canAssign = currentUser ? [Role.LEVEL_1, Role.LEVEL_2, Role.ADMIN].includes(currentUser.role) : false
  const canResolve = currentUser ? [Role.LEVEL_1, Role.LEVEL_2, Role.ADMIN].includes(currentUser.role) : false
  const canAddComment = true // Todos los usuarios pueden agregar comentarios
  const canCreate = true


  // Filtrar tickets: usuarios ven todos sus tickets, otros roles ven solo activos
  const filteredTickets = isUserRole 
    ? tickets.filter((t) => t && t.requester_id === currentUser?.id) // Usuarios ven TODOS sus tickets
    : currentUser?.role === Role.LEVEL_1
      ? tickets.filter((t) => t && t.status !== Status.RESOLVED && t.status !== Status.CLOSED && t.transferred_by !== currentUser?.id) // Nivel 1 no ve tickets que ha transferido
      : tickets.filter((t) => t && t.status !== Status.RESOLVED && t.status !== Status.CLOSED) // Otros roles ven solo activos
  
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
    resolved: filteredTickets.filter((t) => t && (t.status === Status.RESOLVED || t.status === Status.CLOSED)).length,
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
    <div className={`flex-1 grid grid-cols-1 ${isUserRole ? "md:grid-cols-7" : (isAIAssistantVisible ? "md:grid-cols-10" : "md:grid-cols-7")} h-full overflow-hidden bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm`}>
      {/* Ticket List */}
      <div className="md:col-span-3 col-span-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-r border-gray-200/60 dark:border-gray-700/60 overflow-y-auto shadow-sm">
        <div className="p-4 md:p-6 border-b border-gray-200/60 dark:border-gray-700/60 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {isUserRole ? "Mis Solicitudes" : "Todos los Tickets"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isUserRole ? "Gestiona tus solicitudes de soporte" : "Administra todos los tickets del sistema"}
              </p>
            </div>
            <div className="flex gap-3">
              {canUseAI && (
                <button
                  onClick={() => setIsAIAssistantVisible(!isAIAssistantVisible)}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md ${
                    isAIAssistantVisible
                      ? "text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                      : "text-purple-600 bg-purple-100/80 hover:bg-purple-200/80 border border-purple-200/60"
                  }`}
                >
                  {isAIAssistantVisible ? "Ocultar IA" : "Mostrar IA"}
                </button>
              )}
              {canCreate && (
                <button
                  onClick={() => setCreateTicketModalOpen(true)}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  + Nuevo
                </button>
              )}
            </div>
          </div>

          <div className={`grid gap-3 ${isUserRole ? 'grid-cols-2' : 'grid-cols-2'}`}>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/80 dark:from-blue-900/20 dark:to-blue-800/20 p-4 md:p-5 rounded-2xl border border-blue-200/60 dark:border-blue-700/60 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="text-2xl md:text-3xl font-bold text-blue-800 dark:text-blue-300">{stats.total}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Total</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/80 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4 md:p-5 rounded-2xl border border-emerald-200/60 dark:border-emerald-700/60 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="text-2xl md:text-3xl font-bold text-emerald-800 dark:text-emerald-300">{stats.open}</div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">Abiertos</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/80 dark:from-amber-900/20 dark:to-amber-800/20 p-4 md:p-5 rounded-2xl border border-amber-200/60 dark:border-amber-700/60 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="text-2xl md:text-3xl font-bold text-amber-800 dark:text-amber-300">{stats.inProgress}</div>
              <div className="text-sm text-amber-600 dark:text-amber-400 font-semibold">En Progreso</div>
            </div>
            {isUserRole && (
              <div className="bg-gradient-to-br from-green-50 to-green-100/80 dark:from-green-900/20 dark:to-green-800/20 p-4 md:p-5 rounded-2xl border border-green-200/60 dark:border-green-700/60 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="text-2xl md:text-3xl font-bold text-green-800 dark:text-green-300">{stats.resolved}</div>
                <div className="text-sm text-green-600 dark:text-green-400 font-semibold">Resueltos</div>
              </div>
            )}
            {!isUserRole && (
              <div className="bg-gradient-to-br from-red-50 to-red-100/80 dark:from-red-900/20 dark:to-red-800/20 p-4 md:p-5 rounded-2xl border border-red-200/60 dark:border-red-700/60 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="text-2xl md:text-3xl font-bold text-red-800 dark:text-red-300">{stats.high}</div>
                <div className="text-sm text-red-600 dark:text-red-400 font-semibold">Alta Prioridad</div>
              </div>
            )}
          </div>
        </div>
        <div className="p-3 md:p-4">
          {filteredTickets.map((ticket) => 
            ticket ? (
            <div
              key={ticket.id}
              onClick={() => onSelectTicket(ticket)}
              className={`p-4 md:p-5 m-2 md:m-3 rounded-2xl cursor-pointer transition-all duration-300 border ${
                selectedTicket?.id === ticket.id
                  ? "bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-300 dark:border-emerald-600 shadow-lg shadow-emerald-500/10"
                  : "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg hover:bg-white dark:hover:bg-gray-700"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base leading-tight pr-2">{ticket.title}</h3>
                  {/* Solo mostrar información de aliado externo cuando es Externa */}
                  {ticket.origin === 'Externa' && ticket.external_company && (
                    <div className="mt-1 text-xs">
                      <p className="text-blue-600 dark:text-blue-400">
                        <span className="font-semibold">Aliado:</span> {ticket.external_company}
                      </p>
                      {ticket.external_contact && (
                        <p className="text-blue-600 dark:text-blue-400">
                          <span className="font-semibold">Solicitante:</span> {ticket.external_contact}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg font-mono">#​{ticket.id.slice(0, 8)}</span>
              </div>
              <div className="flex gap-2 mb-3">
                <span
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border ${getPriorityColor(ticket.priority)}`}
                >
                  {ticket.priority}
                </span>
                <span className={`px-3 py-1.5 text-xs font-semibold rounded-xl border ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
                {ticket.origin === 'Externa' && (
                  <span className="px-3 py-1.5 text-xs font-semibold rounded-xl border bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
                    Externa
                  </span>
                )}
              </div>
              {!isUserRole && (
                <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                  <span className="font-medium">Solicitante:</span> {getUserName(ticket.requester_id, ticket)}
                </p>
              )}
            </div>
            ) : null
          )}
        </div>
      </div>

      {/* Ticket Detail */}
      <div className={`md:col-span-4 col-span-1 overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm ${isUserRole ? "border-r-0" : ""}`}>
        {selectedTicket ? (
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">{selectedTicket.title}</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">#{selectedTicket.id}</span>
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

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Descripción</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedTicket.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Información del Ticket</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Solicitante:</span>{" "}
                    <span className="font-medium">{getUserName(selectedTicket.requester_id, selectedTicket)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Asignado a:</span>{" "}
                    <span className="font-medium">
                      {selectedTicket.assigned_to ? 
                        `${getUserName(selectedTicket.assigned_to)} (${users.find(u => u.id === selectedTicket.assigned_to)?.role || 'Desconocido'})` 
                        : 'Sin Asignar'
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Origen:</span>{" "}
                    <span className="font-medium">
                      {selectedTicket.origin === 'Externa' ? 'Externa' : 'Interna'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Fechas</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Creado:</span>{" "}
                    <span className="font-medium">{formatOnlyDate(selectedTicket.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Actualizado:</span>{" "}
                    <span className="font-medium">{formatOnlyDate(selectedTicket.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección de Aliado Externo - Solo mostrar cuando origin es Externa */}
            {selectedTicket.origin === 'Externa' && selectedTicket.external_company && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6 mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="text-xl mr-2">🤝</span>
                  Información del Aliado Externo
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Empresa/Aliado:</span>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedTicket.external_company || 'N/A'}</p>
                  </div>
                  {selectedTicket.external_contact && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Solicitante:</span>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedTicket.external_contact}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Historial de Actividad</h4>
                {canAddComment && (
                  <button
                    onClick={() => setAddCommentModalOpen(true)}
                    className="px-4 py-2 text-sm font-semibold text-white bg-accent rounded-xl hover:bg-accent/90 transition-all duration-200"
                  >
                    + Comentario
                  </button>
                )}
              </div>
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {ticketActivities.length > 0 ? (
                  ticketActivities.map((activity) => {
                    // Determinar el ícono según el tipo de actividad
                    let icon = '📝'
                    switch (activity.type) {
                      case 'creation':
                        icon = '📝'
                        break
                      case 'assignment':
                        icon = '👤'
                        break
                      case 'status_change':
                        icon = '🔄'
                        break
                      case 'comment':
                        icon = '💬'
                        break
                      case 'transfer':
                        icon = '🔄'
                        break
                      default:
                        icon = '📝'
                    }
                    
                    return (
                      <div key={activity.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-start space-x-3">
                          <span className="text-lg">{icon}</span>
                          <div className="flex-1">
                            {activity.type === 'comment' ? (
                              <p className="text-gray-800 dark:text-gray-200 mb-2">{activity.description}</p>
                            ) : (
                              <p className="text-gray-800 dark:text-gray-200 mb-2 font-medium">{activity.description}</p>
                            )}
                            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-medium">{activity.user_name || 'Usuario'}</span>
                              <span>{activity.created_at ? formatDate(activity.created_at) : 'Fecha no disponible'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
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
                    <p>No hay actividad registrada</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-6">
              <h4 className="font-semibold text-gray-900 mb-4">Acciones Disponibles</h4>
              <div className="flex flex-wrap gap-3">
                {/* Botón para ver archivos adjuntos - DESHABILITADO TEMPORALMENTE */}
                {/* 
                <button
                  onClick={() => setAttachmentViewerOpen(true)}
                  className="px-6 py-3 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  📎 Ver Archivos
                </button>
                */}

                {canAssign && (
                  <button
                    onClick={() => setAssignTicketModalOpen(true)}
                    className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Asignar Ticket
                  </button>
                )}

                {currentUser?.role === Role.LEVEL_1 && selectedTicket.status !== Status.RESOLVED && selectedTicket.status !== Status.CLOSED && (
                  <button
                    onClick={() => setTransferModalOpen(true)}
                    className="px-6 py-3 text-sm font-semibold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Transferir a Nivel 2
                  </button>
                )}

                {((currentUser?.role === Role.LEVEL_1 || currentUser?.role === Role.LEVEL_2 || currentUser?.role === Role.ADMIN)) && selectedTicket.status !== Status.RESOLVED && selectedTicket.status !== Status.CLOSED && (
                  <button
                    onClick={() => {
                      console.log("[v0] Cambiar Prioridad button clicked")
                      console.log("[v0] Current user role:", currentUser?.role)
                      console.log("[v0] Selected ticket status:", selectedTicket.status)
                      setPriorityModalOpen(true)
                    }}
                    className="px-6 py-3 text-sm font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Cambiar Prioridad
                  </button>
                )}

                {currentUser?.role === Role.ADMIN && selectedTicket.status !== Status.RESOLVED && selectedTicket.status !== Status.CLOSED && (
                  <button
                    onClick={() => setDeleteModalOpen(true)}
                    className="px-6 py-3 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Eliminar Ticket
                  </button>
                )}

                {canResolve && selectedTicket.status !== Status.RESOLVED && selectedTicket.status !== Status.CLOSED && (
                  <button
                    onClick={() => setResolutionModalOpen(true)}
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
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
            <div className="text-center max-w-md mx-auto px-6">
              <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-3xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-12 h-12 text-emerald-600"
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
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Selecciona un ticket</h3>
              <p className="text-gray-600 text-base leading-relaxed mb-6">
                Elige un ticket de la lista para ver todos sus detalles, comentarios y opciones de gestión.
              </p>
              {filteredTickets.length === 0 && (
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-blue-100/80 rounded-2xl border border-blue-200/60 shadow-sm">
                  <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-blue-800 text-sm font-medium">
                    <strong>No hay tickets disponibles</strong><br />
                    <span className="text-blue-600 mt-2 block">
                      {isUserRole
                        ? "No tienes tickets creados aún."
                        : "No hay tickets activos en el sistema."
                      }
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Panel */}
      {canUseAI && isAIAssistantVisible && (
        <div className="md:col-span-3 col-span-1 bg-gradient-to-br from-gray-50 to-gray-100 border-l border-gray-200 overflow-y-auto">
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

            {currentUser?.role === Role.ADMIN && (
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

interface UserManagementViewProps {
  users: User[]
  currentUser: User | null
  onOpenUserModal: (user?: User) => void
  onDeleteUser: (userId: string) => void
  isUserModalOpen: boolean
  onCloseUserModal: () => void
  onSaveUser: (userData: any) => void
  editingUser: User | null
}

const UserManagementView: React.FC<UserManagementViewProps> = ({
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
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Gestionar Usuarios</h2>
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
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Correo</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Teléfono</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rol</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {(users || []).map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.phone || 'No especificado'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.role}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button onClick={() => onOpenUserModal(user)} className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300">
                  Editar
                </button>
                <button onClick={() => onDeleteUser(user.id)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">
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

interface ResolvedTicketsViewProps {
  tickets: Ticket[]
  users: User[]
  currentUser: User | null
}

const ResolvedTicketsView: React.FC<ResolvedTicketsViewProps> = ({ tickets, users, currentUser }) => {
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
    const isUserRole = currentUser?.role === Role.USER
    
    // Incluir tanto tickets resueltos como cerrados
    let resolvedTickets = tickets.filter(ticket => {
      const isResolved = ticket && (ticket.status === Status.RESOLVED || ticket.status === Status.CLOSED)
      
      // Si es usuario, solo mostrar sus propios tickets
      if (isUserRole) {
        const isOwnTicket = ticket.requester_id === currentUser?.id
        console.log("[v0] ResolvedTicketsView - User role - Checking ticket:", {
          id: ticket?.id,
          title: ticket?.title,
          status: ticket?.status,
          requester_id: ticket?.requester_id,
          currentUserId: currentUser?.id,
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
    const user = users.find((u: User) => u.id === id)
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
  const isUserRole = currentUser?.role === Role.USER

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tickets Resueltos</h2>
        <p className="text-gray-600 dark:text-gray-400">
          {isUserRole 
            ? "Visualiza tus tickets resueltos y cerrados" 
            : "Visualiza y analiza los tickets resueltos por responsable y período"
          }
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filtros</h3>
        <div className={`grid grid-cols-1 gap-4 ${isUserRole ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
          {!isUserRole && (
            <div>
              <label htmlFor="responsible" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Responsable
              </label>
              <select
                id="responsible"
                value={selectedResponsible}
                onChange={(e) => setSelectedResponsible(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className={`grid grid-cols-1 gap-4 mb-6 ${isUserRole ? 'md:grid-cols-2 lg:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {isUserRole ? "Mis Tickets Resueltos" : "Total Resueltos"}
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalResolved}</p>
            </div>
          </div>
        </div>
        
        {!isUserRole && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Responsables Activos</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.length}</p>
              </div>
            </div>
          </div>
        )}

        {!isUserRole && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Promedio por Responsable</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.length > 0 ? Math.round(totalResolved / stats.length) : 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {!isUserRole && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Mejor Rendimiento</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.length > 0 ? stats[0].name : "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}

        {isUserRole && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tiempo Promedio</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ranking por Responsable</h3>
          <div className="space-y-3">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                onClick={() => handleResponsibleClick(stat)}
                title="Click para ver tickets resueltos"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400' :
                      index === 1 ? 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200' :
                      index === 2 ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400' :
                      'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{stat.name}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(stat.role)}`}>
                      {stat.role}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{stat.count}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">tickets resueltos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Tickets Resueltos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tickets Resueltos ({totalResolved})</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredTickets.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {isUserRole ? "No tienes tickets resueltos" : "No hay tickets resueltos"}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
              <div key={ticket.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">#{ticket.id} - {ticket.title}</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                        Resuelto
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
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
  
  // --- Notifications ---
  const { notifications, removeNotification, showSuccess, showError, showWarning, showInfo } = useNotifications()
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem("fixit_currentUser")
      if (savedUser) {
        const user = JSON.parse(savedUser)
        
        // Verificar si el usuario fue eliminado
        const deletedUsers = JSON.parse(localStorage.getItem('fixit_deletedUsers') || '[]')
        const isDeleted = deletedUsers.find((du: any) => du.id === user.id || du.email === user.email)
        
        if (isDeleted) {
          console.log("[v0] Saved user was deleted, clearing session")
          localStorage.removeItem("fixit_currentUser")
          // Limpiar la entrada de usuario eliminado
          const updatedDeletedUsers = deletedUsers.filter((du: any) => du.id !== user.id && du.email !== user.email)
          localStorage.setItem('fixit_deletedUsers', JSON.stringify(updatedDeletedUsers))
          return null
        }
        
        return user
      }
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
  const [loginStep, setLoginStep] = useState<'email' | 'code'>('email') // Paso del login: email o código
  const [verificationCode, setVerificationCode] = useState("")
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [codeSent, setCodeSent] = useState(false)

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
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false)
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isWhatsAppAdminOpen, setIsWhatsAppAdminOpen] = useState(false)
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false)
  const [whatsappQR, setWhatsappQR] = useState<string | null>(null)
  const [whatsappStatus, setWhatsappStatus] = useState<{isConnected: boolean, needsQR: boolean}>({isConnected: false, needsQR: false})
  const [isSyncing, setIsSyncing] = useState(false)
  const [locallyDeletedUsers, setLocallyDeletedUsers] = useState<Set<string>>(new Set())
  const [ticketActivities, setTicketActivities] = useState<any[]>([])

  // Limpiar entradas antiguas de usuarios eliminados y asegurar consistencia
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Limpiar eventos antiguos
      const events = JSON.parse(localStorage.getItem('fixit_events') || '[]')
      const now = new Date()
      const cleanedEvents = events.filter((event: any) => {
        const eventTime = new Date(event.timestamp)
        const hoursDiff = (now.getTime() - eventTime.getTime()) / (1000 * 60 * 60)
        return hoursDiff < 24 // Mantener solo por 24 horas
      })
      
      if (cleanedEvents.length !== events.length) {
        localStorage.setItem('fixit_events', JSON.stringify(cleanedEvents))
        console.log("[v0] Cleaned old events")
      }
      
      // Limpiar usuarios eliminados antiguos
      const deletedUsers = JSON.parse(localStorage.getItem('fixit_deletedUsers') || '[]')
      const cleanedDeletedUsers = deletedUsers.filter((du: any) => {
        const deletedAt = new Date(du.deletedAt)
        const hoursDiff = (now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60)
        return hoursDiff < 24 // Mantener solo por 24 horas
      })
      
      if (cleanedDeletedUsers.length !== deletedUsers.length) {
        localStorage.setItem('fixit_deletedUsers', JSON.stringify(cleanedDeletedUsers))
        console.log("[v0] Cleaned old deleted user entries")
      }
      
      // Asegurar que el usuario base esté en localStorage de usuarios
      const storedUsers = JSON.parse(localStorage.getItem('fixit_mock_users') || '[]')
      const baseUserExists = storedUsers.find((u: any) => u.email === "tech@emprendetucarrera.com.co")
      
      if (!baseUserExists) {
        console.log("[v0] Base user not found in localStorage, will be loaded from default data")
      }
    }
  }, [])

  // Limpiar usuarios eliminados localmente después de 1 hora
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setLocallyDeletedUsers(prev => {
        if (prev.size > 0) {
          console.log("[v0] Cleaning up locally deleted users list (1 hour timeout)")
          return new Set() // Limpiar la lista después de 1 hora
        }
        return prev
      })
    }, 60 * 60 * 1000) // 1 hora

    return () => clearInterval(cleanupInterval)
  }, [])

  // Manejar callback de Google OAuth desde URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const googleAuth = urlParams.get('googleAuth')
      const userParam = urlParams.get('user')
      const error = urlParams.get('error')

      // Si hay un error en el proceso de OAuth
      if (error) {
        console.error('[v0] Error en login con Google:', error)
        setLoginError(decodeURIComponent(error))
        // Limpiar parámetros de la URL
        window.history.replaceState({}, document.title, window.location.pathname)
        return
      }

      // Si viene el callback de Google con datos del usuario
      if (googleAuth === 'true' && userParam) {
        try {
          const userData = JSON.parse(decodeURIComponent(userParam))
          console.log('[v0] Usuario autenticado con Google:', userData)

          // Buscar el usuario completo en la lista de usuarios cargados
          const fullUser = users.find((u: User) => u.email === userData.email)

          if (fullUser) {
            // Si es el usuario administrador especial, mostrar selección de rol
            if (userData.email === "tech@emprendetucarrera.com.co") {
              setShowRoleSelection(true)
              setLoginError("")
            } else {
              // Para cualquier otro usuario, hacer login directo
              setCurrentUser(fullUser)
              setLoginError("")
              showSuccess("Inicio de Sesión", `Bienvenido, ${fullUser.name}!`)
            }
          } else {
            // Si no encontramos el usuario completo, usar los datos del callback
            // Esto puede pasar si los usuarios aún no se han cargado
            console.warn('[v0] Usuario no encontrado en lista, usando datos del callback')
            setCurrentUser(userData as User)
            setLoginError("")
          }

          // Limpiar parámetros de la URL
          window.history.replaceState({}, document.title, window.location.pathname)
        } catch (parseError) {
          console.error('[v0] Error parseando datos de usuario de Google:', parseError)
          setLoginError("Error al procesar datos de autenticación")
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      }
    }
  }, [users, showSuccess])

  // Manejar tokens de Google OAuth que vienen en hash fragment (cuando Supabase redirige a /)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/' && window.location.hash.includes('access_token')) {
      // Si estamos en la raíz con tokens en el hash, redirigir a /auth/callback
      console.log('[v0] Detectados tokens de OAuth en hash, redirigiendo a /auth/callback')
      window.location.href = '/auth/callback' + window.location.hash
      return
    }
  }, [])

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
          (error as Error)?.message?.includes("Could not find the table") ||
          (error as Error)?.message?.includes("schema cache") ||
          (error as any)?.code === "PGRST106"
        ) {
          console.log("[v0] Database tables not found, showing setup screen")
          setShowDatabaseSetup(true)
          setDatabaseReady(false)
        } else {
          // For other errors, assume DB might be ready but empty or connection issue
          // We set databaseReady to true to avoid infinite loading spinner
          console.log("[v0] Generic error loading users, proceeding with empty state")
          setDatabaseReady(true)
        }
        // Keep empty array on error
      } finally {
        setIsLoadingUsers(false)
      }
    }

    loadUsers()
  }, [])

  // Función para cargar tickets que puede ser reutilizada
  const loadTickets = useCallback(async () => {
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
  }, [])

  // Función para cargar actividades de un ticket
  const loadTicketActivities = useCallback(async (ticketId: string) => {
    try {
      console.log("[v0] Loading activities for ticket:", ticketId)
      const activities = await activityService.getActivityByTicket(ticketId)
      console.log("[v0] Fetched activities:", activities)
      setTicketActivities(activities)
    } catch (error) {
      console.error("[v0] Error loading activities:", error)
      setTicketActivities([])
    }
  }, [])

  useEffect(() => {
    if (databaseReady) {
      loadTickets()
    }
  }, [databaseReady, loadTickets])

  useEffect(() => {
    if (typeof window !== 'undefined') {
    if (currentUser) {
      localStorage.setItem("fixit_currentUser", JSON.stringify(currentUser))
    } else {
      localStorage.removeItem("fixit_currentUser")
      }
    }
  }, [currentUser])

  // Cargar actividades cuando se selecciona un ticket
  useEffect(() => {
    if (selectedTicket?.id) {
      loadTicketActivities(selectedTicket.id)
    } else {
      setTicketActivities([])
    }
  }, [selectedTicket?.id, loadTicketActivities])

  // Validar que el usuario actual siga existiendo en la base de datos
  // Solo validar cuando cambie el usuario actual, no en cada sincronización
  useEffect(() => {
    const validateCurrentUser = async () => {
      if (currentUser && users.length > 0) {
        console.log("[v0] Validating current user session...")
        console.log("[v0] Current user ID:", currentUser.id)
        console.log("[v0] Current user email:", currentUser.email)
        console.log("[v0] Available users count:", users.length)
        
        // Verificar si el usuario fue eliminado (marcado en localStorage)
        if (typeof window !== 'undefined') {
          const deletedUsers = JSON.parse(localStorage.getItem('fixit_deletedUsers') || '[]')
          const isDeleted = deletedUsers.find((du: any) => du.id === currentUser?.id || du.email === currentUser?.email)
          
          if (isDeleted) {
            console.log("[v0] Current user was deleted, logging out...")
            showWarning("Sesión Expirada", "Tu sesión ha expirado. El usuario ha sido eliminado del sistema.")
            setCurrentUser(null)
            localStorage.removeItem("fixit_currentUser")
            // Limpiar la entrada de usuario eliminado
            const updatedDeletedUsers = deletedUsers.filter((du: any) => du.id !== currentUser?.id && du.email !== currentUser?.email)
            localStorage.setItem('fixit_deletedUsers', JSON.stringify(updatedDeletedUsers))
            return
          }
        }
        
        // Verificar si el usuario existe en la base de datos actual
        const userExists = users.find(u => u.id === currentUser?.id && u.email === currentUser?.email)
        
        if (!userExists) {
          console.log("[v0] Current user no longer exists in database, logging out...")
          console.log("[v0] Available users:", users.map(u => ({ id: u.id, email: u.email })))
          showWarning("Sesión Expirada", "Tu sesión ha expirado. El usuario ha sido eliminado del sistema.")
          setCurrentUser(null)
          if (typeof window !== 'undefined') {
            localStorage.removeItem("fixit_currentUser")
          }
        } else {
          console.log("[v0] Current user session is valid")
        }
      }
    }

    // Solo validar cuando el usuario cambie o cuando se carguen los usuarios por primera vez
    if (databaseReady && users.length > 0) {
      validateCurrentUser()
    }
  }, [currentUser, databaseReady]) // Removido 'users' de las dependencias para evitar validaciones excesivas

  // Sincronización mejorada usando SyncService
  useEffect(() => {
    if (!currentUser || !databaseReady) return

    // Función de sincronización
    const performSync = async () => {
      try {
        setIsSyncing(true)
        console.log("[v0] Syncing data across devices...")
        
        // Recargar datos frescos
        const freshUsers = await userServiceClient.getAllUsers()
        const freshTickets = await ticketServiceClient.getAllTickets()
        
        console.log("[v0] Fresh users from Supabase:", freshUsers.length, "users")
        console.log("[v0] Fresh users details:", freshUsers.map(u => ({ id: u.id, email: u.email, name: u.name })))
        console.log("[v0] Current users in state:", users.length, "users")
        console.log("[v0] Current users details:", users.map(u => ({ id: u.id, email: u.email, name: u.name })))
        
        // Comparar usuarios específicos
        const freshUserIds = freshUsers.map(u => u.id)
        const currentUserIds = users.map(u => u.id)
        const usersInFreshButNotInCurrent = freshUsers.filter(fu => !currentUserIds.includes(fu.id))
        const usersInCurrentButNotInFresh = users.filter(u => !freshUserIds.includes(u.id))
        
        console.log("[v0] Users in Supabase but NOT in local state:", usersInFreshButNotInCurrent.map(u => ({ id: u.id, email: u.email, name: u.name })))
        console.log("[v0] Users in local state but NOT in Supabase:", usersInCurrentButNotInFresh.map(u => ({ id: u.id, email: u.email, name: u.name })))
        
        // Verificar si el usuario actual sigue existiendo
        const currentUserExists = freshUsers.find(u => u.id === currentUser?.id && u.email === currentUser?.email)
        
        if (!currentUserExists) {
          console.log("[v0] WARNING: Current user no longer exists during sync!")
          console.log("[v0] Current user being checked:", { id: currentUser?.id, email: currentUser?.email })
          console.log("[v0] Available users in fresh data:", freshUsers.map(u => ({ id: u.id, email: u.email, name: u.name })))
          console.log("[v0] This might be a temporary sync issue, not logging out automatically")
          // No cerrar sesión automáticamente durante la sincronización para evitar cierres incorrectos
          // showWarning("Sesión Expirada", "Tu sesión ha expirado. El usuario ha sido eliminado del sistema.")
          // setCurrentUser(null)
          // if (typeof window !== 'undefined') {
          //   localStorage.removeItem("fixit_currentUser")
          // }
          // return
        } else {
          console.log("[v0] Current user confirmed in fresh data during sync")
        }
        
        // Verificar cambios en usuarios (no solo cantidad, sino contenido)
        const usersChanged = JSON.stringify(freshUsers) !== JSON.stringify(users)
        if (usersChanged) {
          console.log("[v0] User data changed, updating...")
          
          // Filtrar usuarios que fueron eliminados localmente
          const filteredFreshUsers = freshUsers.filter(fu => !locallyDeletedUsers.has(fu.id))
          const usersToRestore = freshUsers.filter(fu => !users.find(u => u.id === fu.id) && !locallyDeletedUsers.has(fu.id))
          
          console.log("[v0] Users that would be restored (excluding locally deleted):", 
            usersToRestore.map(u => ({ id: u.id, email: u.email, name: u.name }))
          )
          console.log("[v0] Locally deleted users (preventing restoration):", Array.from(locallyDeletedUsers))
          
          // Limpiar usuarios recreados de la lista de eliminados
          if (typeof window !== 'undefined') {
            const deletedUsers = JSON.parse(localStorage.getItem('fixit_deletedUsers') || '[]')
            const freshUserEmails = freshUsers.map(u => u.email)
            const updatedDeletedUsers = deletedUsers.filter((du: any) => !freshUserEmails.includes(du.email))
            
            if (updatedDeletedUsers.length !== deletedUsers.length) {
              localStorage.setItem('fixit_deletedUsers', JSON.stringify(updatedDeletedUsers))
              console.log("[v0] Cleaned recreated users from deleted users list")
            }
          }
          
          // Solo actualizar si hay cambios reales (no solo usuarios eliminados localmente)
          if (JSON.stringify(filteredFreshUsers) !== JSON.stringify(users)) {
            setUsers(filteredFreshUsers)
          }
        }
        
        // Verificar cambios en tickets
        const ticketsChanged = JSON.stringify(freshTickets) !== JSON.stringify(tickets)
        if (ticketsChanged) {
          console.log("[v0] Ticket data changed, updating...")
          setTickets(freshTickets)
        }
        
      } catch (error) {
        console.error("[v0] Error during sync:", error)
      } finally {
        setIsSyncing(false)
      }
    }

    // Iniciar sincronización automática
    syncService.startAutoSync(performSync, 10000) // Cada 10 segundos (menos agresivo)

    return () => {
      syncService.stopAutoSync()
    }
  }, [currentUser, databaseReady, users.length, tickets.length])

  // Escuchar eventos de sincronización usando SyncService
  useEffect(() => {
    if (!currentUser) return

    const handleSyncEvent = async (event: any) => {
      console.log("[v0] Sync event received:", event.type)
      
      // Verificar si es un evento de eliminación de usuario
      if (event.type === 'USER_DELETED' && 
          (event.data.id === currentUser?.id || event.data.email === currentUser?.email)) {
        console.log("[v0] User deletion event detected, logging out...")
        alert("Tu sesión ha expirado. El usuario ha sido eliminado del sistema.")
        setCurrentUser(null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem("fixit_currentUser")
        }
        return
      }
      
      // Para otros eventos, forzar sincronización
      if (['USER_CREATED', 'USER_UPDATED', 'TICKET_CREATED', 'TICKET_UPDATED', 'TICKET_DELETED'].includes(event.type)) {
        console.log("[v0] Data change event detected, triggering sync...")
        setTimeout(async () => {
          try {
            const freshUsers = await userServiceClient.getAllUsers()
            const freshTickets = await ticketServiceClient.getAllTickets()
            setUsers(freshUsers)
            setTickets(freshTickets)
            console.log("[v0] Data synced after event detection")
          } catch (error) {
            console.error("[v0] Error syncing data after event:", error)
          }
        }, 1000)
      }
    }

    // Suscribirse a eventos de sincronización
    const unsubscribe = syncService.onSyncEvent(handleSyncEvent)

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [currentUser])

  // --- Event Handlers ---
  // Función para manejar login con Google
  const handleGoogleLogin = () => {
    console.log("[v0] Iniciando login con Google...")
    // Redirigir al endpoint de Google OAuth
    window.location.href = '/api/auth/google'
  }

  // Función para enviar código de verificación
  const handleSendCode = async (email: string) => {
    try {
      setIsSendingCode(true)
      setLoginError("")

      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setCodeSent(true)
        setLoginStep('code')
        setLoginError("")
      } else {
        setLoginError(data.error || 'Error al enviar código de verificación')
      }
    } catch (error) {
      console.error('[v0] Error sending verification code:', error)
      setLoginError('Error al enviar código de verificación. Por favor intenta nuevamente.')
    } finally {
      setIsSendingCode(false)
    }
  }

  // Función para verificar código y hacer login
  const handleVerifyCode = async (email: string, code: string) => {
    try {
      setLoginError("")

      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()

      if (response.ok && data.user) {
        // Verificar si el usuario existe en la base de datos local
        const user = users.find((u: User) => u.email === data.user.email)
        
        if (user) {
          console.log("[v0] User verified and found:", { email: user.email, role: user.role, name: user.name })
          
          // Limpiar entrada de usuario eliminado si existe (usuario fue recreado)
          if (typeof window !== 'undefined') {
            const deletedUsers = JSON.parse(localStorage.getItem('fixit_deletedUsers') || '[]')
            const wasDeleted = deletedUsers.find((du: any) => du.email === email)
            
            if (wasDeleted) {
              console.log("[v0] User was recreated, removing from deleted users list")
              const updatedDeletedUsers = deletedUsers.filter((du: any) => du.email !== email)
              localStorage.setItem('fixit_deletedUsers', JSON.stringify(updatedDeletedUsers))
            }
          }

          // Si es el usuario administrador especial, mostrar selección de rol
          if (email === "tech@emprendetucarrera.com.co") {
            setShowRoleSelection(true)
            setLoginError("")
            setLoginStep('email')
            setVerificationCode('')
            setCodeSent(false)
          } else {
            // Para cualquier otro usuario, hacer login directo
            setCurrentUser(user)
            setLoginError("")
            setLoginStep('email')
            setVerificationCode('')
            setCodeSent(false)
          }
        } else {
          console.log("[v0] User verified but not found in local database")
          setLoginError("Usuario no encontrado en la base de datos. Por favor contacta al administrador.")
        }
      } else {
        setLoginError(data.error || 'Código inválido o expirado')
      }
    } catch (error) {
      console.error('[v0] Error verifying code:', error)
      setLoginError('Error al verificar código. Por favor intenta nuevamente.')
    }
  }

  const handleSelectRole = (role: Role) => {
    // Siempre usar el usuario tech@emprendetucarrera.com.co pero con el rol seleccionado
    const baseUser = users.find((u: User) => u.email === "tech@emprendetucarrera.com.co")
    
    if (!baseUser) {
      setLoginError("No se encontró el usuario administrador en la base de datos.")
      return
    }
    
    // Crear un usuario temporal con el rol seleccionado pero manteniendo la identidad original
    const userToImpersonate: User = {
      ...baseUser,
      role: role, // Cambiar solo el rol, mantener email y otros datos
    }
    
    console.log("[v0] Impersonating role:", role, "for user:", baseUser.email)
    console.log("[v0] User data:", { email: userToImpersonate.email, role: userToImpersonate.role, name: userToImpersonate.name })

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

  const openPriorityModal = () => {
    setIsPriorityModalOpen(true)
  }

  const closePriorityModal = () => {
    setIsPriorityModalOpen(false)
  }

  const openResolutionModal = () => {
    setIsResolutionModalOpen(true)
  }

  const closeResolutionModal = () => {
    setIsResolutionModalOpen(false)
  }

  const openDeleteModal = () => {
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
  }

  const openWhatsAppAdmin = () => {
    setIsWhatsAppAdminOpen(true)
    checkWhatsAppStatus()
  }

  const closeWhatsAppAdmin = () => {
    setIsWhatsAppAdminOpen(false)
  }

  const checkWhatsAppStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status')
      const result = await response.json()
      
      if (result.status === 'success') {
        setWhatsappStatus({
          isConnected: result.data.isConnected,
          needsQR: result.data.needsQR,
          // isAvailable: result.data.isAvailable
        })
        setWhatsappQR(result.data.qrCode)
      }
    } catch (error) {
      console.error('[WhatsApp] Error checking status:', error)
      // En caso de error, asumir que no está disponible
      setWhatsappStatus({
        isConnected: false,
        needsQR: false,
        // isAvailable: false
      })
    }
  }

  const handleWhatsAppConnect = async () => {
    try {
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'connect' })
      })
      
      const result = await response.json()
      
      if (result.status === 'success') {
        // Verificar estado después de un momento
        setTimeout(() => {
          checkWhatsAppStatus()
        }, 2000)
      }
    } catch (error) {
      console.error('[WhatsApp] Error connecting:', error)
    }
  }

  const handleWhatsAppDisconnect = async () => {
    try {
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'disconnect' })
      })
      
      const result = await response.json()
      
      if (result.status === 'success') {
        setWhatsappStatus({ isConnected: false, needsQR: false })
        setWhatsappQR(null)
      }
    } catch (error) {
      console.error('[WhatsApp] Error disconnecting:', error)
    }
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
        console.error("[v0] Detailed error:", (error as Error).message)
      }
      return false
    }
  }

  interface CreateUserData {
    name: string
    email: string
    phone?: string
    role: Role
  }

  const handleSaveUser = async (userData: CreateUserData) => {
    try {
      console.log("[v0] Attempting to create user with data:", userData)

      let user: User
      if (editingUser) {
        console.log("[v0] Updating existing user with ID:", editingUser.id)
        user = await userServiceClient.updateUser(editingUser.id, userData)
        setUsers(users.map((u: User) => (u.id === user.id ? user : u)))
        console.log("[v0] User updated successfully:", user)
        
        // Crear evento de actualización de usuario usando SyncService
        const updateEvent = createUserEvent('USER_UPDATED', user)
        await syncService.sendSyncEvent(updateEvent)
        console.log("[v0] User update event created")
      } else {
        console.log("[v0] Creating new user")
        user = await userServiceClient.createUser(userData)
        setUsers([user, ...users])
        console.log("[v0] User created successfully:", user)
        
        // Crear evento de creación de usuario usando SyncService
        const createEvent = createUserEvent('USER_CREATED', user)
        await syncService.sendSyncEvent(createEvent)
        console.log("[v0] User creation event created")
        
        // Enviar email de bienvenida al nuevo usuario
        try {
          await sendEmailNotification("welcome", {
            userName: user.name
          }, user.email)
          console.log("[v0] Welcome email sent to:", user.email)
        } catch (emailError) {
          console.error("[v0] Error sending welcome email:", emailError)
          // No mostrar error al usuario, solo logear
        }
        
        // Si se creó un usuario con un ID que estaba marcado como eliminado localmente, removerlo de la lista
        setLocallyDeletedUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(user.id)
          return newSet
        })
      }

      closeUserModal()
      console.log("[v0] User save process completed successfully")
    } catch (error) {
      const errorMessage = (error as Error).message || "Error desconocido"

      // Check if it's a validation error (like duplicate email)
      if (errorMessage.includes("Ya existe un usuario") || errorMessage.includes("duplicate")) {
        console.log("[v0] Validation error (not a system error):", errorMessage)
        showWarning("Validación", errorMessage)
      } else {
        // This is a real system error
        console.error("[v0] System error saving user:", error)
        console.error("[v0] Error details:", {
          message: (error as Error).message,
          stack: (error as Error).stack,
          userData: userData,
        })
        showError("Error del Sistema", "Error al guardar usuario: " + errorMessage)
      }
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (currentUser?.id === userId) {
      showWarning("Acción No Permitida", "No puedes eliminar al usuario con el que has iniciado sesión.")
      return
    }
    if (window.confirm("¿Estás seguro de que quieres eliminar a este usuario?")) {
      try {
        console.log("[v0] Starting user deletion for ID:", userId)
        console.log("[v0] Available user IDs in state:", users.map(u => ({ id: u.id, email: u.email, name: u.name })))
        
        await userServiceClient.deleteUser(userId)
        console.log("[v0] User deleted successfully from database")
        
        // Marcar como eliminado localmente para prevenir restauración
        setLocallyDeletedUsers(prev => new Set([...prev, userId]))
        setUsers(users.filter((u) => u.id !== userId))
        console.log("[v0] User removed from local state and marked as locally deleted")
        
        // Crear evento de eliminación usando SyncService
        const deletedUser = users.find(u => u.id === userId)
        if (deletedUser) {
          const deleteEvent = createUserEvent('USER_DELETED', {
            ...deletedUser,
            deletedBy: currentUser?.email
          })
          await syncService.sendSyncEvent(deleteEvent)
          
          // También marcar en la lista de usuarios eliminados para validación local
          if (typeof window !== 'undefined') {
            const deletedUsers = JSON.parse(localStorage.getItem('fixit_deletedUsers') || '[]')
            deletedUsers.push({
              id: userId,
              email: deletedUser.email,
              deletedAt: getColombiaTimestampLocal()
            })
            localStorage.setItem('fixit_deletedUsers', JSON.stringify(deletedUsers))
          }
          
          console.log("[v0] User deletion event created for cross-device sync")
        }
        
        showSuccess("Usuario Eliminado", "Usuario eliminado exitosamente")
      } catch (error) {
        console.error("[v0] Error deleting user:", error)
        showError("Error", "Error al eliminar usuario. Por favor intenta de nuevo.")
      }
    }
  }

  const handleCreateTicket = async (ticketData: any) => {
    if (!currentUser) return

    try {
      console.log("[v0] handleCreateTicket - Datos recibidos:", ticketData)
      console.log("[v0] handleCreateTicket - Attachments recibidos:", ticketData.attachments)
      
      // Determinar el requester_id: si es interna y es personal TIC, usar el seleccionado, sino usar el usuario actual
      let requesterId = currentUser.id
      if (ticketData.origin === 'Interna' && currentUser.role !== Role.USER && ticketData.requester_id) {
        // Personal TIC creando ticket interno para otro usuario
        requesterId = ticketData.requester_id
      }
      
      const ticketToCreate = {
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority,
        category: ticketData.category || 'Otro', // Categoría por defecto si no se proporciona
        assigned_to: ticketData.assigned_to,
        requester_id: requesterId,
        origin: ticketData.origin || 'Interna',
        external_company: ticketData.origin === 'Externa' ? (ticketData.external_company || null) : null,
        external_contact: ticketData.origin === 'Externa' ? (ticketData.external_contact || null) : null,
      }
      console.log("[v0] handleCreateTicket - Creating ticket with data:", ticketToCreate)
      const newTicket = await ticketServiceClient.createTicket(ticketToCreate)
      console.log("[v0] handleCreateTicket - Created ticket:", newTicket)

      // Registrar actividad de creación
      try {
        const creationActivity = createActivityEvents.creation(
          newTicket.id,
          currentUser.id,
          newTicket.title
        )
        await activityService.createActivity(creationActivity)
        console.log("[v0] handleCreateTicket - Creation activity registered")
      } catch (activityError) {
        console.error("[v0] handleCreateTicket - Error creating activity:", activityError)
        // No fallar la creación del ticket si hay error con la actividad
      }

      // Procesar archivos adjuntos - DESHABILITADO TEMPORALMENTE
      /*
      if (ticketData.attachments && ticketData.attachments.length > 0) {
        console.log("[v0] handleCreateTicket - Processing attachments:", ticketData.attachments.length)
        console.log("[v0] handleCreateTicket - Attachment files:", ticketData.attachments)
        
        for (const file of ticketData.attachments) {
          try {
            await attachmentServiceClient.uploadAttachment({
              file: file,
              ticket_id: newTicket.id,
              uploaded_by: currentUser.id
            })
            console.log("[v0] handleCreateTicket - Attachment uploaded:", file.name)
          } catch (attachmentError) {
            console.error("[v0] handleCreateTicket - Error uploading attachment:", attachmentError)
            // No fallar la creación del ticket si hay error con un attachment
          }
        }
      }
      */

      setTickets([newTicket, ...tickets])
      closeCreateTicketModal() // Use the proper function name

      // Crear evento de creación de ticket usando SyncService
      const createEvent = createTicketEvent('TICKET_CREATED', newTicket)
      await syncService.sendSyncEvent(createEvent)
      console.log("[v0] Ticket creation event created")

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
      showError("Error", "Error al crear ticket. Por favor intenta de nuevo.")
    }
  }

  const handleUpdateTicket = async (ticketId: string, updates: any) => {
    try {
      console.log("[v0] handleUpdateTicket - Updating ticket:", ticketId, "with updates:", updates)
      const updatedTicket = await ticketServiceClient.updateTicket(ticketId, updates)
      console.log("[v0] handleUpdateTicket - Updated ticket received:", updatedTicket)
      console.log("[v0] handleUpdateTicket - Updated ticket status:", updatedTicket?.status, "type:", typeof updatedTicket?.status)
      
      const newTickets = tickets.map((t: Ticket) => (t && t.id === ticketId ? updatedTicket : t)).filter((t: Ticket) => t)
      console.log("[v0] handleUpdateTicket - New tickets array:", newTickets)
      setTickets(newTickets)

      if (selectedTicket?.id === ticketId) {
        console.log("[v0] handleUpdateTicket - Updating selected ticket:", updatedTicket)
        setSelectedTicket(updatedTicket)
      }
    } catch (error) {
      console.error("[v0] Error updating ticket:", error)
      showError("Error", "Error al actualizar ticket. Por favor intenta de nuevo.")
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
        showError("Error", "Error al eliminar ticket. Por favor intenta de nuevo.")
      }
    }
  }

  const handleAssignTicket = async (assigneeId: string) => {
    if (!selectedTicket) return

    try {
      console.log("[v0] handleAssignTicket - Assigning ticket:", selectedTicket.id, "to user:", assigneeId)
      await handleUpdateTicket(selectedTicket.id, { assigned_to: assigneeId })
      
      // Registrar actividad de asignación
      try {
        const assignee = users.find((u: User) => u.id === assigneeId)
        const assignmentActivity = createActivityEvents.assignment(
          selectedTicket.id,
          currentUser?.id || '',
          assigneeId,
          assignee?.name || 'Usuario'
        )
        await activityService.createActivity(assignmentActivity)
        console.log("[v0] handleAssignTicket - Assignment activity registered")
      } catch (activityError) {
        console.error("[v0] handleAssignTicket - Error creating activity:", activityError)
        // No fallar la asignación si hay error con la actividad
      }
      
      console.log("[v0] handleAssignTicket - Assignment completed, closing modal")
      closeAssignTicketModal()

      // Send notification email
      const assignee = users.find((u: User) => u.id === assigneeId)
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
            createdBy: users.find(u => u.id === selectedTicket.requester_id)?.name || "Desconocido",
            createdAt: selectedTicket.created_at,
          },
          assignee.email,
          "Asignación de ticket"
        )
      }
    } catch (error) {
      console.error("[v0] Error assigning ticket:", error)
      showError("Error", "Error al asignar ticket. Por favor intenta de nuevo.")
    }
  }

  const handleResolveTicket = async (ticketId: string, status: Status = Status.RESOLVED) => {
    try {
      console.log("[v0] handleResolveTicket - Resolving ticket:", ticketId, "with status:", status)
      console.log("[v0] handleResolveTicket - Status.RESOLVED value:", Status.RESOLVED)
      await handleUpdateTicket(ticketId, { status })
      console.log("[v0] handleResolveTicket - Ticket resolved successfully")

      // Send notification email
      const ticket = tickets.find((t: Ticket) => t && t.id === ticketId)
      const requester = users.find((u: User) => u.id === ticket?.requester_id)
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
      showError("Error", "Error al resolver ticket. Por favor intenta de nuevo.")
    }
  }

  const handleAddComment = async (commentText: string) => {
    if (!selectedTicket || !currentUser) return

    try {
      const newComment = {
        id: Date.now(),
        author: currentUser.name,
        text: commentText,
        timestamp: getColombiaTimestampLocal(),
      }

      // Crear comentario en la tabla comments
      const { commentService } = await import("@/services/commentService")
      await commentService.createComment({
        ticket_id: selectedTicket.id,
        user_id: currentUser?.id,
        content: commentText
      })
      
      // Registrar actividad de comentario
      try {
        const commentActivity = createActivityEvents.comment(
          selectedTicket.id,
          currentUser.id,
          commentText
        )
        await activityService.createActivity(commentActivity)
        console.log("[v0] handleAddComment - Comment activity registered")
      } catch (activityError) {
        console.error("[v0] handleAddComment - Error creating activity:", activityError)
        // No fallar el comentario si hay error con la actividad
      }
      
      // Refrescar la vista de tickets y actividades
      await loadTickets()
      await loadTicketActivities(selectedTicket.id)
      closeAddCommentModal()
    } catch (error) {
      console.error("[v0] Error adding comment:", error)
      showError("Error", "Error al agregar comentario. Por favor intenta de nuevo.")
    }
  }

  const handleTransferToLevel2 = async (assigneeId: string) => {
    if (!selectedTicket) return

    try {
      await handleUpdateTicket(selectedTicket.id, {
        assigned_to: assigneeId,
        status: Status.IN_PROGRESS,
        transferred_by: currentUser?.id, // Marcar quién transfirió el ticket
      })
      
      // Agregar comentario automático sobre la transferencia
      const assignee = users.find((u: User) => u.id === assigneeId)
      if (assignee) {
        await handleAddComment(
          `Ticket transferido a Nivel 2 - Asignado a: ${assignee.name} (${assignee.role})`
        )
      }
      
      closeTransferModal()

      // Send notification email
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
            createdBy: users.find(u => u.id === selectedTicket.requester_id)?.name || "Desconocido",
            createdAt: selectedTicket.created_at,
          },
          assignee.email,
          "Transferencia de ticket a Nivel 2"
        )
      }
    } catch (error) {
      console.error("[v0] Error transferring ticket:", error)
      showError("Error", "Error al transferir ticket. Por favor intenta de nuevo.")
    }
  }

  const handleChangePriority = async (newPriority: Priority) => {
    if (!selectedTicket) return

    try {
      const oldPriority = selectedTicket.priority
      await handleUpdateTicket(selectedTicket.id, {
        priority: newPriority,
      })
      
      // Registrar actividad de cambio de prioridad
      try {
        const priorityActivity = createActivityEvents.statusChange(
          selectedTicket.id,
          currentUser?.id || '',
          oldPriority,
          newPriority
        )
        await activityService.createActivity(priorityActivity)
        console.log("[v0] handleChangePriority - Priority change activity registered")
      } catch (activityError) {
        console.error("[v0] handleChangePriority - Error creating activity:", activityError)
        // No fallar el cambio si hay error con la actividad
      }
      
      // Agregar comentario automático sobre el cambio de prioridad
      await handleAddComment(
        `Prioridad cambiada de "${oldPriority}" a "${newPriority}"`
      )
      
      setIsPriorityModalOpen(false)

      // Send notification email al solicitante
      const requester = users.find((u: User) => u.id === selectedTicket.requester_id)
      if (requester) {
        await sendEmailNotification(
          "ticket-updated",
          {
            ticketId: selectedTicket.id.toString(),
            title: selectedTicket.title,
            description: selectedTicket.description,
            priority: newPriority,
            status: selectedTicket.status,
            assignedTo: users.find(u => u.id === selectedTicket.assigned_to)?.name || "Sin Asignar",
            createdBy: users.find(u => u.id === selectedTicket.requester_id)?.name || "Desconocido",
            createdAt: selectedTicket.created_at,
          },
          requester.email,
          "Cambio de prioridad"
        )
      }
    } catch (error) {
      console.error("[v0] Error changing priority:", error)
      showError("Error", "Error al cambiar la prioridad. Por favor intenta de nuevo.")
    }
  }

  const handleResolveWithMessage = async (resolutionMessage: string, wasResolved: boolean) => {
    if (!selectedTicket) return

    try {
      const oldStatus = selectedTicket.status
      // Actualizar el ticket a resuelto
      await handleUpdateTicket(selectedTicket.id, { status: Status.RESOLVED })
      
      // Registrar actividad de cambio de estado
      try {
        const statusActivity = createActivityEvents.statusChange(
          selectedTicket.id,
          currentUser?.id || '',
          oldStatus,
          Status.RESOLVED
        )
        await activityService.createActivity(statusActivity)
        console.log("[v0] handleResolveWithMessage - Status change activity registered")
      } catch (activityError) {
        console.error("[v0] handleResolveWithMessage - Error creating activity:", activityError)
        // No fallar la resolución si hay error con la actividad
      }
      
      // Crear mensaje de resolución
      const resolutionStatus = wasResolved ? "✅ RESUELTO" : "❌ NO RESUELTO"
      const resolutionComment = `**${resolutionStatus}**\n\n**Mensaje de resolución:**\n${resolutionMessage}`
      
      // Agregar comentario con el mensaje de resolución
      await handleAddComment(resolutionComment)
      
      setIsResolutionModalOpen(false)

      // Send notification email al solicitante
      const requester = users.find((u: User) => u.id === selectedTicket.requester_id)
      if (requester) {
        await sendEmailNotification(
          "ticket-updated",
          {
            ticketId: selectedTicket.id.toString(),
            title: selectedTicket.title,
            description: selectedTicket.description,
            priority: selectedTicket.priority,
            status: Status.RESOLVED,
            assignedTo: users.find(u => u.id === selectedTicket.assigned_to)?.name || "Sin Asignar",
            createdBy: users.find(u => u.id === selectedTicket.requester_id)?.name || "Desconocido",
            createdAt: selectedTicket.created_at,
            resolutionMessage: resolutionMessage,
            wasResolved: wasResolved,
          },
          requester.email,
          "Ticket resuelto"
        )
      }
    } catch (error) {
      console.error("[v0] Error resolving ticket with message:", error)
      showError("Error", "Error al resolver el ticket. Por favor intenta de nuevo.")
    }
  }

  const handleDeleteWithMessage = async (deleteMessage: string) => {
    if (!selectedTicket) return

    try {
      // Crear mensaje de eliminación
      const deleteComment = `**🗑️ TICKET ELIMINADO**\n\n**Motivo de eliminación:**\n${deleteMessage}\n\n**Eliminado por:** ${currentUser?.name} (${currentUser?.role})`
      
      // Agregar comentario con el mensaje de eliminación antes de eliminar
      await handleAddComment(deleteComment)
      
      // Send notification email al solicitante antes de eliminar
      const requester = users.find((u: User) => u.id === selectedTicket.requester_id)
      if (requester) {
        await sendEmailNotification(
          "ticket-updated",
          {
            ticketId: selectedTicket.id.toString(),
            title: selectedTicket.title,
            description: selectedTicket.description,
            priority: selectedTicket.priority,
            status: "Eliminado",
            assignedTo: users.find(u => u.id === selectedTicket.assigned_to)?.name || "Sin Asignar",
            createdBy: users.find(u => u.id === selectedTicket.requester_id)?.name || "Desconocido",
            createdAt: selectedTicket.created_at,
            deleteMessage: deleteMessage,
            deletedBy: currentUser?.name || "Administrador",
          },
          requester.email,
          "Ticket eliminado"
        )
      }

      // Eliminar el ticket
      await handleDeleteTicket(selectedTicket.id)
      
      setIsDeleteModalOpen(false)
      setSelectedTicket(null) // Limpiar la selección
      
    } catch (error) {
      console.error("[v0] Error deleting ticket with message:", error)
      showError("Error", "Error al eliminar el ticket. Por favor intenta de nuevo.")
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
  // Solo técnicos: Nivel 1 y Nivel 2. Si el usuario actual es ADMIN, permitir asignarse a sí mismo
  const assignableUsers = users.filter(
    (u) => [Role.LEVEL_1, Role.LEVEL_2].includes(u.role) || (currentUser?.role === Role.ADMIN && u.id === currentUser.id)
  )

  if (!currentUser) {
    return (
      <LoginScreen
        onSendCode={handleSendCode}
        onVerifyCode={handleVerifyCode}
        onGoogleLogin={handleGoogleLogin}
        onSelectRole={handleSelectRole}
        showRoleSelection={showRoleSelection}
        setShowRoleSelection={setShowRoleSelection}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginError={loginError}
        loginStep={loginStep}
        setLoginStep={setLoginStep}
        verificationCode={verificationCode}
        setVerificationCode={setVerificationCode}
        isSendingCode={isSendingCode}
        codeSent={codeSent}
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
        <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col md:flex-row overflow-hidden">
          <Sidebar
            currentUser={currentUser}
            currentView={currentView}
            setCurrentView={(view: string) => setCurrentView(view as "users" | "tickets" | "resolved")}
            onLogout={handleLogout}
            setCreateTicketModalOpen={openCreateTicketModal}
            setIsWhatsAppAdminOpen={setIsWhatsAppAdminOpen}
            isSyncing={isSyncing}
          />
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden md:ml-0 bg-gradient-to-br from-gray-50/80 to-white/60 dark:from-gray-900/80 dark:to-gray-800/60 backdrop-blur-sm">
            {currentView === "tickets" ? (
              <TicketsView
                tickets={tickets}
                users={users}
                currentUser={currentUser}
                selectedTicket={selectedTicket}
                onSelectTicket={handleSelectTicket}
                onGenerateReport={handleGenerateReport}
                setTransferModalOpen={setTransferModalOpen}
                solution={solution}
                isSuggesting={isSuggesting}
                report={report}
                isReporting={isReporting}
                onCreateTicket={handleCreateTicket}
                onAssignTicket={handleAssignTicket}
                onResolveTicket={handleResolveTicket}
                onAddComment={handleAddComment}
                onCreateTicketModalOpen={isCreateTicketModalOpen}
                setCreateTicketModalOpen={setCreateTicketModalOpen}
                onAssignTicketModalOpen={isAssignTicketModalOpen}
                setAssignTicketModalOpen={setAssignTicketModalOpen}
                onAddCommentModalOpen={isAddCommentModalOpen}
                setAddCommentModalOpen={setAddCommentModalOpen}
                setPriorityModalOpen={setIsPriorityModalOpen}
                setResolutionModalOpen={setIsResolutionModalOpen}
                setDeleteModalOpen={setIsDeleteModalOpen}
                isAttachmentViewerOpen={isAttachmentViewerOpen}
                setAttachmentViewerOpen={setIsAttachmentViewerOpen}
                ticketActivities={ticketActivities}
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
          </div>

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
          <ChangePriorityModal
            isOpen={isPriorityModalOpen}
            onClose={closePriorityModal}
            onPriorityChange={handleChangePriority}
            currentPriority={selectedTicket?.priority || Priority.MEDIUM}
          />
          <ResolutionModal
            isOpen={isResolutionModalOpen}
            onClose={closeResolutionModal}
            onResolve={handleResolveWithMessage}
            ticketTitle={selectedTicket?.title || ""}
          />
          <DeleteTicketModal
            isOpen={isDeleteModalOpen}
            onClose={closeDeleteModal}
            onDelete={handleDeleteWithMessage}
            ticketTitle={selectedTicket?.title || ""}
          />
          <WhatsAppAdminPanel
            isOpen={isWhatsAppAdminOpen}
            onClose={closeWhatsAppAdmin}
            qrCode={whatsappQR}
            status={whatsappStatus}
            onConnect={handleWhatsAppConnect}
            onDisconnect={handleWhatsAppDisconnect}
          />
          {/* AttachmentViewer */}
          <AttachmentViewer
            isOpen={isAttachmentViewerOpen}
            onClose={() => setIsAttachmentViewerOpen(false)}
            ticketId={selectedTicket?.id || ""}
            currentUser={currentUser}
          />
        </div>
      )}
      
      {/* Sistema de Notificaciones */}
      <NotificationContainer
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />
    </>
  )
}

export default App

const Database = ({ className }: { className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
  </svg>
)
