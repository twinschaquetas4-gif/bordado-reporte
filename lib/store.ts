import type { Employee, ProductionRecord, User } from './types'

const EMPLOYEES_KEY = 'bordado_employees'
const RECORDS_KEY = 'bordado_records'
const USERS_KEY = 'bordado_users'
const CURRENT_USER_KEY = 'bordado_current_user'

// Default admin user
const DEFAULT_ADMIN: User = {
  id: 'admin-default',
  username: 'admin',
  password: 'admin123', // In production, this should be hashed
  name: 'Administrador',
  role: 'admin',
  active: true,
  createdAt: new Date().toISOString(),
}

export function loadEmployees(): Employee[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(EMPLOYEES_KEY)
  return data ? JSON.parse(data) : []
}

export function saveEmployees(employees: Employee[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees))
}

export function loadRecords(): ProductionRecord[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(RECORDS_KEY)
  return data ? JSON.parse(data) : []
}

export function saveRecords(records: ProductionRecord[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function employeeHasRecords(employeeId: string, records: ProductionRecord[]): boolean {
  return records.some(record => record.employeeId === employeeId)
}

// User management functions
export function loadUsers(): User[] {
  if (typeof window === 'undefined') return [DEFAULT_ADMIN]
  const data = localStorage.getItem(USERS_KEY)
  if (!data) {
    // Initialize with default admin
    saveUsers([DEFAULT_ADMIN])
    return [DEFAULT_ADMIN]
  }
  const users = JSON.parse(data) as User[]
  // Ensure default admin always exists
  if (!users.find(u => u.username === 'admin')) {
    users.push(DEFAULT_ADMIN)
    saveUsers(users)
  }
  return users
}

export function saveUsers(users: User[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem(CURRENT_USER_KEY)
  return data ? JSON.parse(data) : null
}

export function setCurrentUser(user: User | null): void {
  if (typeof window === 'undefined') return
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(CURRENT_USER_KEY)
  }
}

export function authenticateUser(username: string, password: string): User | null {
  const users = loadUsers()
  const user = users.find(u => u.username === username && u.password === password && u.active)
  return user || null
}
