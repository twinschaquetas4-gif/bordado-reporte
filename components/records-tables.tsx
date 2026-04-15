'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ChevronDown, ChevronRight, Edit2, Trash2, User, Calendar } from 'lucide-react'
import type { Employee, ProductionRecord } from '@/lib/types'
import { calculateMetrics, formatNumber, formatDate, groupRecordsByEmployeeAndDay } from '@/lib/calculations'

interface RecordsTablesProps {
  employees: Employee[]
  records: ProductionRecord[]
  onEditRecord?: (record: ProductionRecord) => void
  onDeleteRecord?: (recordId: string) => void
  canEdit?: boolean
  canDelete?: boolean
}

export function RecordsTables({
  employees,
  records,
  onEditRecord,
  onDeleteRecord,
  canEdit = false,
  canDelete = false,
}: RecordsTablesProps) {
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set())
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<ProductionRecord | null>(null)

  const handleDeleteConfirm = () => {
    if (deleteConfirm && onDeleteRecord) {
      onDeleteRecord(deleteConfirm.id)
      setDeleteConfirm(null)
    }
  }

  const employeeSummaries = groupRecordsByEmployeeAndDay(records, employees)

  const toggleEmployee = (employeeId: string) => {
    setExpandedEmployees(prev => {
      const next = new Set(prev)
      if (next.has(employeeId)) {
        next.delete(employeeId)
      } else {
        next.add(employeeId)
      }
      return next
    })
  }

  const toggleDay = (key: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  if (employeeSummaries.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No hay registros de producción todavía.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Agrega un nuevo registro usando el formulario de arriba.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Registros por Operario</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedEmployees(new Set(employeeSummaries.map(s => s.employee.id)))}
            className="border-border text-muted-foreground"
          >
            Expandir todos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedEmployees(new Set())}
            className="border-border text-muted-foreground"
          >
            Colapsar todos
          </Button>
        </div>
      </div>

      {employeeSummaries.map((summary) => {
        const isEmployeeExpanded = expandedEmployees.has(summary.employee.id)

        return (
          <Card key={summary.employee.id} className="border-border bg-card overflow-hidden">
            <Collapsible open={isEmployeeExpanded} onOpenChange={() => toggleEmployee(summary.employee.id)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {isEmployeeExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div>
                        <span className="text-lg text-card-foreground">{summary.employee.name}</span>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{summary.totalRecords} registros</span>
                          <span>{summary.dailySummaries.length} días</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-sm text-muted-foreground">Total cantidad</p>
                        <p className="text-lg font-semibold text-primary">{summary.totalCantidad.toLocaleString('es-CO')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total puntadas</p>
                        <p className="text-lg font-semibold text-chart-2">{formatNumber(summary.totalPuntadas, 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Prom. rendimiento</p>
                        <p className="text-lg font-semibold text-chart-1">{formatNumber(summary.promedioRendimiento, 2)}</p>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  {summary.dailySummaries.map((day) => {
                    const dayKey = `${summary.employee.id}-${day.date}`
                    const isDayExpanded = expandedDays.has(dayKey)

                    return (
                      <Collapsible key={dayKey} open={isDayExpanded} onOpenChange={() => toggleDay(dayKey)}>
                        <div className="border border-border rounded-lg overflow-hidden bg-secondary/20">
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-secondary/40 transition-colors">
                              <div className="flex items-center gap-3">
                                {isDayExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="font-medium text-foreground">{formatDate(day.date)}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {day.records.length} registros
                                </Badge>
                              </div>
                              <div className="flex items-center gap-6 text-sm">
                                <div className="text-right">
                                  <span className="text-muted-foreground">Cant: </span>
                                  <span className="font-medium text-primary">{day.totalCantidad.toLocaleString('es-CO')}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-muted-foreground">Punt: </span>
                                  <span className="font-medium text-chart-2">{formatNumber(day.totalPuntadas, 0)}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-muted-foreground">Rend: </span>
                                  <span className="font-medium text-chart-1">{formatNumber(day.promedioRendimiento, 2)}</span>
                                </div>
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="border-t border-border overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="hover:bg-transparent border-border">
                                    <TableHead className="text-muted-foreground">Colegio</TableHead>
                                    <TableHead className="text-muted-foreground">Máquina</TableHead>
                                    <TableHead className="text-muted-foreground">Prenda</TableHead>
                                    <TableHead className="text-muted-foreground text-right">Apliq.</TableHead>
                                    <TableHead className="text-muted-foreground text-right">Cant.</TableHead>
                                    <TableHead className="text-muted-foreground text-right">Cabezas</TableHead>
                                    <TableHead className="text-muted-foreground text-right">Puntadas</TableHead>
                                    <TableHead className="text-muted-foreground text-right">Tot. Punt.</TableHead>
                                    <TableHead className="text-muted-foreground text-right">Tandas</TableHead>
                                    <TableHead className="text-muted-foreground">Horario</TableHead>
                                    <TableHead className="text-muted-foreground text-right">Min.</TableHead>
                                    <TableHead className="text-muted-foreground text-right">P/M/C</TableHead>
                                    <TableHead className="text-muted-foreground text-right">Min. Pega</TableHead>
                                    <TableHead className="text-muted-foreground text-right">Rend. Real</TableHead>
                                    {(canEdit || canDelete) && <TableHead className="text-muted-foreground">Acciones</TableHead>}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {day.records.map((record) => {
                                    const metrics = calculateMetrics(record)
                                    return (
                                      <TableRow key={record.id} className="hover:bg-secondary/30 border-border">
                                        <TableCell className="text-foreground text-sm">{record.colegio || '-'}</TableCell>
                                        <TableCell className="text-foreground text-sm">{record.machine}</TableCell>
                                        <TableCell className="text-foreground text-sm">{record.prenda || '-'}</TableCell>
                                        <TableCell className="text-foreground text-sm text-right">{record.apliques}</TableCell>
                                        <TableCell className="text-foreground text-sm text-right font-medium">{record.cantidad}</TableCell>
                                        <TableCell className="text-foreground text-sm text-right">{record.cabezasDisponibles}</TableCell>
                                        <TableCell className="text-foreground text-sm text-right">{record.puntadasBordado.toLocaleString('es-CO')}</TableCell>
                                        <TableCell className="text-primary text-sm text-right font-medium">
                                          {formatNumber(metrics.totalPuntadas, 0)}
                                        </TableCell>
                                        <TableCell className="text-chart-3 text-sm text-right">
                                          {metrics.tandas}
                                        </TableCell>
                                        <TableCell className="text-foreground text-sm whitespace-nowrap">
                                          {record.horaInicio} - {record.horaFin}
                                        </TableCell>
                                        <TableCell className="text-chart-4 text-sm text-right">
                                          {formatNumber(metrics.minutos, 0)}
                                        </TableCell>
                                        <TableCell className="text-chart-2 text-sm text-right">
                                          {formatNumber(metrics.puntadasPorMinutoPorCabeza, 2)}
                                        </TableCell>
                                        <TableCell className="text-warning text-sm text-right">
                                          {formatNumber(metrics.minutosEnPegaApliques, 1)}
                                        </TableCell>
                                        <TableCell className="text-chart-1 text-sm text-right font-bold">
                                          {formatNumber(metrics.puntadasPorMinutoPorCabezaDescontandoPega, 2)}
                                        </TableCell>
                                        {(canEdit || canDelete) && (
                                          <TableCell>
                                            <div className="flex items-center gap-1">
                                              {canEdit && onEditRecord && (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => onEditRecord(record)}
                                                  className="text-muted-foreground hover:text-primary"
                                                >
                                                  <Edit2 className="h-4 w-4" />
                                                </Button>
                                              )}
                                              {canDelete && onDeleteRecord && (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => setDeleteConfirm(record)}
                                                  className="text-muted-foreground hover:text-destructive"
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              )}
                                            </div>
                                          </TableCell>
                                        )}
                                      </TableRow>
                                    )
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    )
                  })}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )
      })}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Registro</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este registro?
              {deleteConfirm && (
                <span className="block mt-2 text-foreground font-medium">
                  {deleteConfirm.prenda || deleteConfirm.colegio || 'Sin descripción'} - {deleteConfirm.cantidad} unidades
                </span>
              )}
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
