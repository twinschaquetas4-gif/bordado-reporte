'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter, X, Download } from 'lucide-react'
import type { Employee, ProductionRecord, MachineType } from '@/lib/types'
import { MACHINES } from '@/lib/types'
import { getWeekLabel, calculateMetrics } from '@/lib/calculations'

interface FiltersProps {
  employees: Employee[]
  records: ProductionRecord[]
  selectedEmployee: string | null
  selectedWeek: string | null
  selectedMachine: MachineType | null
  dateFrom: string
  dateTo: string
  searchTerm: string
  onEmployeeChange: (value: string | null) => void
  onWeekChange: (value: string | null) => void
  onMachineChange: (value: MachineType | null) => void
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onSearchChange: (value: string) => void
  onClearFilters: () => void
}

export function Filters({
  employees,
  records,
  selectedEmployee,
  selectedWeek,
  selectedMachine,
  dateFrom,
  dateTo,
  searchTerm,
  onEmployeeChange,
  onWeekChange,
  onMachineChange,
  onDateFromChange,
  onDateToChange,
  onSearchChange,
  onClearFilters,
}: FiltersProps) {
  const weeks = useMemo(() => {
    const weekSet = new Set<string>()
    records.forEach(r => weekSet.add(getWeekLabel(r.date)))
    return Array.from(weekSet).sort().reverse()
  }, [records])

  const hasActiveFilters = selectedEmployee || selectedWeek || selectedMachine || dateFrom || dateTo || searchTerm

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filtros
          </div>

          {/* Search */}
          <div className="space-y-1 min-w-[200px]">
            <Label className="text-xs text-muted-foreground">Buscar</Label>
            <Input
              placeholder="Colegio, prenda..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Employee filter */}
          <div className="space-y-1 min-w-[150px]">
            <Label className="text-xs text-muted-foreground">Operario</Label>
            <Select
              value={selectedEmployee || 'all'}
              onValueChange={(value) => onEmployeeChange(value === 'all' ? null : value)}
            >
              <SelectTrigger className="h-9 bg-input border-border text-foreground">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-popover-foreground">Todos</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id} className="text-popover-foreground">
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Week filter */}
          <div className="space-y-1 min-w-[180px]">
            <Label className="text-xs text-muted-foreground">Semana</Label>
            <Select
              value={selectedWeek || 'all'}
              onValueChange={(value) => onWeekChange(value === 'all' ? null : value)}
            >
              <SelectTrigger className="h-9 bg-input border-border text-foreground">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-popover-foreground">Todas</SelectItem>
                {weeks.map((week) => (
                  <SelectItem key={week} value={week} className="text-popover-foreground">
                    {week}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Machine filter */}
          <div className="space-y-1 min-w-[120px]">
            <Label className="text-xs text-muted-foreground">Máquina</Label>
            <Select
              value={selectedMachine || 'all'}
              onValueChange={(value) => onMachineChange(value === 'all' ? null : value as MachineType)}
            >
              <SelectTrigger className="h-9 bg-input border-border text-foreground">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-popover-foreground">Todas</SelectItem>
                {MACHINES.map((machine) => (
                  <SelectItem key={machine.type} value={machine.type} className="text-popover-foreground">
                    {machine.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Desde</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="h-9 w-[140px] bg-input border-border text-foreground"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hasta</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="h-9 w-[140px] bg-input border-border text-foreground"
            />
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-9 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface ExportButtonProps {
  records: ProductionRecord[]
  employees: Employee[]
}

export function ExportButton({ records, employees }: ExportButtonProps) {
  const employeeMap = new Map(employees.map(e => [e.id, e]))

  const handleExport = () => {
    const headers = [
      'Operario',
      'Colegio',
      'Máquina',
      'Fecha',
      'Semana',
      'Prenda',
      'Apliques',
      'Cantidad',
      'Cabezas',
      'Puntadas Bordado',
      'Total Puntadas',
      'Tandas',
      'Hora Inicio',
      'Hora Fin',
      'Horas',
      'Minutos',
      'Puntadas/Min',
      'Puntadas/Min/Cabeza',
      'Min Pega',
      'Rendimiento Real',
    ]

    const rows = records.map(record => {
      const metrics = calculateMetrics(record)
      const employee = employeeMap.get(record.employeeId)
      return [
        employee?.name || 'Desconocido',
        record.colegio,
        record.machine,
        record.date,
        getWeekLabel(record.date),
        record.prenda,
        record.apliques,
        record.cantidad,
        record.cabezasDisponibles,
        record.puntadasBordado,
        metrics.totalPuntadas.toFixed(0),
        metrics.tandas,
        record.horaInicio,
        record.horaFin,
        metrics.horas.toFixed(2),
        metrics.minutos.toFixed(0),
        metrics.puntadasPorMinuto.toFixed(2),
        metrics.puntadasPorMinutoPorCabeza.toFixed(2),
        metrics.minutosEnPegaApliques.toFixed(1),
        metrics.puntadasPorMinutoPorCabezaDescontandoPega.toFixed(2),
      ]
    })

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `produccion_bordado_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <Button onClick={handleExport} variant="outline" className="border-border">
      <Download className="h-4 w-4 mr-2" />
      Exportar CSV
    </Button>
  )
}
