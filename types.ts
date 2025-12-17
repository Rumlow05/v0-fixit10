export enum Role {
  USER = 'Usuario',
  ADMIN = 'Administrador',
  LEVEL_1 = 'Nivel 1',
  LEVEL_2 = 'Nivel 2',
}

export enum Status {
  OPEN = 'Abierto',
  IN_PROGRESS = 'En Progreso',
  RESOLVED = 'Resuelto',
  CLOSED = 'Cerrado',
}

export enum Priority {
  LOW = 'Baja',
  MEDIUM = 'Media',
  HIGH = 'Alta',
  CRITICAL = 'Crítica',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string; // Número de teléfono para WhatsApp
  role: Role;
}

export interface Comment {
  id: number;
  author: string;
  text: string;
  timestamp: string;
}

export interface Attachment {
  id: string;
  ticket_id: string;
  filename: string;
  original_name: string;
  file_size: number;
  file_type: string;
  file_path: string;
  uploaded_by: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  requester_id: string;
  assigned_to?: string;
  transferred_by?: string; // Usuario que transfirió el ticket
  status: Status;
  priority: Priority;
  category: string;
  origin?: 'Interna' | 'Externa'; // Origen del ticket
  external_company?: string; // Nombre del aliado externo
  external_contact?: string; // Nombre del contacto externo
  created_at: string;
  updated_at: string;
  comments: Comment[];
  attachments?: Attachment[]; // Archivos adjuntos del ticket
}

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}
