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
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Comment {
  id: number;
  author: string;
  text: string;
  timestamp: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  requesterId: number;
  assigneeId?: number;
  status: Status;
  priority: Priority;
  category: string;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
}

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}
