// User roles and types
export type UserRole = 'admin' | 'supervisor' | 'viewer'

export interface User {
  id: string
  username: string
  password: string // In production, this should be hashed
  name: string
  role: UserRole
  active: boolean
  createdAt: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  viewer: 'Visualizador',
}

export const ROLE_PERMISSIONS: Record<UserRole, {
  canManageUsers: boolean
  canManageEmployees: boolean
  canCreateRecords: boolean
  canEditRecords: boolean
  canDeleteRecords: boolean
  canViewAllRecords: boolean
  canViewReports: boolean
  canExportData: boolean
}> = {
  admin: {
    canManageUsers: true,
    canManageEmployees: true,
    canCreateRecords: true,
    canEditRecords: true,
    canDeleteRecords: true,
    canViewAllRecords: true,
    canViewReports: true,
    canExportData: true,
  },
  supervisor: {
    canManageUsers: false,
    canManageEmployees: false,
    canCreateRecords: true,
    canEditRecords: true,
    canDeleteRecords: false,
    canViewAllRecords: true,
    canViewReports: true,
    canExportData: true,
  },
  viewer: {
    canManageUsers: false,
    canManageEmployees: false,
    canCreateRecords: false,
    canEditRecords: false,
    canDeleteRecords: false,
    canViewAllRecords: true,
    canViewReports: true,
    canExportData: false,
  },
}

export interface Employee {
  id: string
  name: string
  active: boolean
  createdAt: string
}

export interface ProductionRecord {
  id: string
  employeeId: string
  colegio: string
  machine: MachineType
  date: string
  prenda: string
  apliques: number
  cantidad: number
  cabezasDisponibles: number
  puntadasBordado: number
  horaInicio: string
  horaFin: string
  createdAt: string
}

export type MachineType = '15 A' | '15 B' | '12 A' | '12 B' | '8' | '6' | '1'

export const MACHINES: { type: MachineType; suggestedHeads: number }[] = [
  { type: '15 A', suggestedHeads: 15 },
  { type: '15 B', suggestedHeads: 15 },
  { type: '12 A', suggestedHeads: 12 },
  { type: '12 B', suggestedHeads: 12 },
  { type: '8', suggestedHeads: 8 },
  { type: '6', suggestedHeads: 6 },
  { type: '1', suggestedHeads: 1 },
]

export interface CalculatedMetrics {
  totalPuntadas: number
  tandas: number
  horas: number
  minutos: number
  puntadasPorMinuto: number
  puntadasPorMinutoPorCabeza: number
  minutosEnPegaApliques: number
  puntadasPorMinutoPorCabezaDescontandoPega: number
}

export interface DailySummary {
  date: string
  records: ProductionRecord[]
  totalCantidad: number
  totalPuntadas: number
  totalMinutosPega: number
  promedioRendimiento: number
}

export interface EmployeeSummary {
  employee: Employee
  dailySummaries: DailySummary[]
  totalRecords: number
  totalCantidad: number
  totalPuntadas: number
  totalMinutosPega: number
  promedioRendimiento: number
}

export interface WeeklySummary {
  weekNumber: number
  weekLabel: string
  startDate: string
  endDate: string
  records: ProductionRecord[]
  totalCantidad: number
  totalPuntadas: number
  totalMinutosPega: number
  promedioRendimiento: number
}
