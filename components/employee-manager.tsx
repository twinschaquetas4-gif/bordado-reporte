'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Users, UserPlus, UserX, UserCheck, Trash2 } from 'lucide-react'
import type { Employee, ProductionRecord } from '@/lib/types'
import { generateId, employeeHasRecords } from '@/lib/store'

interface EmployeeManagerProps {
  employees: Employee[]
  records: ProductionRecord[]
  onEmployeesChange: (employees: Employee[]) => void
}

export function EmployeeManager({ employees, records, onEmployeesChange }: EmployeeManagerProps) {
  const [newEmployeeName, setNewEmployeeName] = useState('')
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<string | null>(null)

  const handleCreateEmployee = () => {
    if (!newEmployeeName.trim()) return
    
    const newEmployee: Employee = {
      id: generateId(),
      name: newEmployeeName.trim(),
      active: true,
      createdAt: new Date().toISOString(),
    }
    
    onEmployeesChange([...employees, newEmployee])
    setNewEmployeeName('')
  }

  const handleToggleActive = (employeeId: string) => {
    onEmployeesChange(
      employees.map(emp =>
        emp.id === employeeId ? { ...emp, active: !emp.active } : emp
      )
    )
  }

  const handleDeleteEmployee = (employeeId: string) => {
    onEmployeesChange(employees.filter(emp => emp.id !== employeeId))
    setDeleteConfirmStep(null)
  }

  const activeEmployees = employees.filter(e => e.active)
  const inactiveEmployees = employees.filter(e => !e.active)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-card-foreground">
          <Users className="h-5 w-5 text-primary" />
          Gestión de Empleados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create new employee */}
        <div className="flex gap-2">
          <Input
            placeholder="Nombre del nuevo empleado"
            value={newEmployeeName}
            onChange={(e) => setNewEmployeeName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateEmployee()}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
          <Button onClick={handleCreateEmployee} disabled={!newEmployeeName.trim()}>
            <UserPlus className="h-4 w-4 mr-2" />
            Crear
          </Button>
        </div>

        {/* Active employees */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Empleados activos ({activeEmployees.length})
          </h4>
          {activeEmployees.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No hay empleados activos</p>
          ) : (
            <div className="grid gap-2">
              {activeEmployees.map((employee) => {
                const hasRecords = employeeHasRecords(employee.id, records)
                return (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {employee.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">{employee.name}</span>
                      <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                        Activo
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(employee.id)}
                        className="text-muted-foreground hover:text-warning"
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Desactivar
                      </Button>
                      {!hasRecords && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteConfirmStep(employee.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card border-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-card-foreground">
                                Confirmar eliminación
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de que deseas eliminar a <strong>{employee.name}</strong>?
                                Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-secondary text-secondary-foreground border-border">
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive">
                                    Sí, eliminar
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-card border-border">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-destructive">
                                      Segunda confirmación requerida
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta es una eliminación permanente. 
                                      ¿Realmente deseas eliminar a <strong>{employee.name}</strong>?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-secondary text-secondary-foreground border-border">
                                      No, cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteEmployee(employee.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Eliminar permanentemente
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {hasRecords && (
                        <span className="text-xs text-muted-foreground italic">
                          Tiene registros
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Inactive employees */}
        {inactiveEmployees.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Empleados inactivos ({inactiveEmployees.length})
            </h4>
            <div className="grid gap-2">
              {inactiveEmployees.map((employee) => {
                const hasRecords = employeeHasRecords(employee.id, records)
                return (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border opacity-70"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium text-muted-foreground">
                          {employee.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-muted-foreground">{employee.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        Inactivo
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(employee.id)}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Reactivar
                      </Button>
                      {!hasRecords && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card border-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-card-foreground">
                                Confirmar eliminación
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de que deseas eliminar a <strong>{employee.name}</strong>?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-secondary text-secondary-foreground border-border">
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive">
                                    Sí, eliminar
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-card border-border">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-destructive">
                                      Segunda confirmación
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Confirma la eliminación permanente de <strong>{employee.name}</strong>.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-secondary text-secondary-foreground border-border">
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteEmployee(employee.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {hasRecords && (
                        <span className="text-xs text-muted-foreground italic">
                          Tiene registros
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
