'use client'

import { useState, useEffect, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LayoutDashboard, Users, BarChart3, Calendar, LogOut, UserCircle, Shield, UserCog, Eye } from 'lucide-react'
import { SummaryCards } from '@/components/summary-cards'
import { EmployeeManager } from '@/components/employee-manager'
import { ProductionForm } from '@/components/production-form'
import { RecordsTables } from '@/components/records-tables'
import { ProductionCharts } from '@/components/production-charts'
import { WeeklyReports } from '@/components/weekly-reports'
import { Filters, ExportButton } from '@/components/filters'
import { UserManager } from '@/components/user-manager'
import { LoginForm } from '@/components/login-form'
import { useAuth } from '@/lib/auth-context'
import type { Employee, ProductionRecord, MachineType } from '@/lib/types'
import { ROLE_LABELS } from '@/lib/types'
import { loadEmployees, saveEmployees, loadRecords, saveRecords } from '@/lib/store'
import { getWeekLabel } from '@/lib/calculations'

const ROLE_ICONS = {
  admin: Shield,
  supervisor: UserCog,
  viewer: Eye,
}

const ROLE_COLORS = {
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  supervisor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  viewer: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

export default function HomePage() {
  const { user, isLoading: authLoading, logout, permissions } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [records, setRecords] = useState<ProductionRecord[]>([])
  const [editingRecord, setEditingRecord] = useState<ProductionRecord | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Filters state
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)
  const [selectedMachine, setSelectedMachine] = useState<MachineType | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Load data from localStorage on mount
  useEffect(() => {
    setEmployees(loadEmployees())
    setRecords(loadRecords())
    setIsLoaded(true)
  }, [])

  // Save employees to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      saveEmployees(employees)
    }
  }, [employees, isLoaded])

  // Save records to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      saveRecords(records)
    }
  }, [records, isLoaded])

  // Filter records based on filters
  const filteredRecords = useMemo(() => {
    let result = records

    if (selectedEmployee) {
      result = result.filter(r => r.employeeId === selectedEmployee)
    }

    if (selectedWeek) {
      result = result.filter(r => getWeekLabel(r.date) === selectedWeek)
    }

    if (selectedMachine) {
      result = result.filter(r => r.machine === selectedMachine)
    }

    if (dateFrom) {
      result = result.filter(r => r.date >= dateFrom)
    }

    if (dateTo) {
      result = result.filter(r => r.date <= dateTo)
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      result = result.filter(r =>
        r.colegio.toLowerCase().includes(search) ||
        r.prenda.toLowerCase().includes(search)
      )
    }

    return result
  }, [records, selectedEmployee, selectedWeek, selectedMachine, dateFrom, dateTo, searchTerm])

  const handleSaveRecord = (record: ProductionRecord) => {
    if (editingRecord) {
      setRecords(prev => prev.map(r => r.id === record.id ? record : r))
    } else {
      setRecords(prev => [...prev, record])
    }
    setEditingRecord(null)
  }

  const handleDeleteRecord = (recordId: string) => {
    setRecords(prev => prev.filter(r => r.id !== recordId))
  }

  const clearFilters = () => {
    setSelectedEmployee(null)
    setSelectedWeek(null)
    setSelectedMachine(null)
    setDateFrom('')
    setDateTo('')
    setSearchTerm('')
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginForm />
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Cargando datos...</div>
      </div>
    )
  }

  const RoleIcon = ROLE_ICONS[user.role]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Informe de Producción Bordado
              </h1>
              <p className="text-sm text-muted-foreground">
                Sistema de control de producción textil
              </p>
            </div>
            <div className="flex items-center gap-3">
              {permissions?.canExportData && (
                <ExportButton records={filteredRecords} employees={employees} />
              )}
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">{user.name}</span>
                    <Badge variant="outline" className={`text-xs ${ROLE_COLORS[user.role]}`}>
                      <RoleIcon className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">{ROLE_LABELS[user.role]}</span>
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className="text-xs text-muted-foreground">@{user.username}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                    <RoleIcon className="h-4 w-4 mr-2" />
                    {ROLE_LABELS[user.role]}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <SummaryCards records={filteredRecords} />

        {/* Filters */}
        <Filters
          employees={employees}
          records={records}
          selectedEmployee={selectedEmployee}
          selectedWeek={selectedWeek}
          selectedMachine={selectedMachine}
          dateFrom={dateFrom}
          dateTo={dateTo}
          searchTerm={searchTerm}
          onEmployeeChange={setSelectedEmployee}
          onWeekChange={setSelectedWeek}
          onMachineChange={setSelectedMachine}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onSearchChange={setSearchTerm}
          onClearFilters={clearFilters}
        />

        {/* Main Content Tabs */}
        <Tabs defaultValue="registros" className="space-y-6">
          <TabsList className="bg-secondary border border-border flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="registros" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Registros
            </TabsTrigger>
            {permissions?.canManageEmployees && (
              <TabsTrigger value="empleados" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="h-4 w-4 mr-2" />
                Operarios
              </TabsTrigger>
            )}
            {permissions?.canManageUsers && (
              <TabsTrigger value="usuarios" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Shield className="h-4 w-4 mr-2" />
                Usuarios
              </TabsTrigger>
            )}
            {permissions?.canViewReports && (
              <>
                <TabsTrigger value="graficas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Gráficas
                </TabsTrigger>
                <TabsTrigger value="semanas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  Semanas
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Registros Tab */}
          <TabsContent value="registros" className="space-y-6">
            {permissions?.canCreateRecords && (
              <ProductionForm
                employees={employees}
                records={records}
                editingRecord={editingRecord}
                onSave={handleSaveRecord}
                onCancelEdit={() => setEditingRecord(null)}
              />
            )}
            <RecordsTables
              employees={employees}
              records={filteredRecords}
              onEditRecord={permissions?.canEditRecords ? setEditingRecord : undefined}
              onDeleteRecord={permissions?.canDeleteRecords ? handleDeleteRecord : undefined}
              canEdit={permissions?.canEditRecords ?? false}
              canDelete={permissions?.canDeleteRecords ?? false}
            />
          </TabsContent>

          {/* Empleados Tab */}
          {permissions?.canManageEmployees && (
            <TabsContent value="empleados">
              <EmployeeManager
                employees={employees}
                records={records}
                onEmployeesChange={setEmployees}
              />
            </TabsContent>
          )}

          {/* Usuarios Tab */}
          {permissions?.canManageUsers && (
            <TabsContent value="usuarios">
              <UserManager />
            </TabsContent>
          )}

          {/* Gráficas Tab */}
          {permissions?.canViewReports && (
            <TabsContent value="graficas">
              <ProductionCharts
                employees={employees}
                records={records}
                selectedEmployee={selectedEmployee}
                selectedWeek={selectedWeek}
              />
            </TabsContent>
          )}

          {/* Semanas Tab */}
          {permissions?.canViewReports && (
            <TabsContent value="semanas">
              <WeeklyReports records={filteredRecords} />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12">
        <div className="container mx-auto px-4 py-4">
          <p className="text-sm text-muted-foreground text-center">
            Sistema de Control de Producción de Bordado - Sesión activa: {user.name} ({ROLE_LABELS[user.role]})
          </p>
        </div>
      </footer>
    </div>
  )
}
