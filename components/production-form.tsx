'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ClipboardList, Save, RotateCcw, Lightbulb, X, AlertTriangle } from 'lucide-react'
import type { Employee, ProductionRecord, MachineType } from '@/lib/types'
import { MACHINES } from '@/lib/types'
import { generateId } from '@/lib/store'

interface ProductionFormProps {
  employees: Employee[]
  records: ProductionRecord[]
  editingRecord: ProductionRecord | null
  onSave: (record: ProductionRecord) => void
  onCancelEdit: () => void
}

// Helper to convert time string "HH:MM" to minutes from midnight
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Check if two time ranges overlap on the same date
function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  let s1 = timeToMinutes(start1)
  let e1 = timeToMinutes(end1)
  let s2 = timeToMinutes(start2)
  let e2 = timeToMinutes(end2)
  
  // Handle overnight shifts
  if (e1 <= s1) e1 += 24 * 60
  if (e2 <= s2) e2 += 24 * 60
  
  // Check overlap
  return s1 < e2 && s2 < e1
}

export function ProductionForm({
  employees,
  records,
  editingRecord,
  onSave,
  onCancelEdit,
}: ProductionFormProps) {
  const activeEmployees = employees.filter(e => e.active)
  
  const [formData, setFormData] = useState({
    employeeId: '',
    colegio: '',
    machine: '' as MachineType | '',
    date: new Date().toISOString().split('T')[0],
    prenda: '',
    apliques: 0,
    cantidad: 0,
    cabezasDisponibles: 0,
    puntadasBordado: 0,
    horaInicio: '08:00',
    horaFin: '17:00',
  })

  useEffect(() => {
    if (editingRecord) {
      setFormData({
        employeeId: editingRecord.employeeId,
        colegio: editingRecord.colegio,
        machine: editingRecord.machine,
        date: editingRecord.date,
        prenda: editingRecord.prenda,
        apliques: editingRecord.apliques,
        cantidad: editingRecord.cantidad,
        cabezasDisponibles: editingRecord.cabezasDisponibles,
        puntadasBordado: editingRecord.puntadasBordado,
        horaInicio: editingRecord.horaInicio,
        horaFin: editingRecord.horaFin,
      })
    }
  }, [editingRecord])

  const handleMachineChange = (machine: MachineType) => {
    const machineConfig = MACHINES.find(m => m.type === machine)
    setFormData(prev => ({
      ...prev,
      machine,
      cabezasDisponibles: machineConfig?.suggestedHeads || prev.cabezasDisponibles,
    }))
  }

  const handleUseSuggestedHeads = () => {
    if (formData.machine) {
      const machineConfig = MACHINES.find(m => m.type === formData.machine)
      if (machineConfig) {
        setFormData(prev => ({
          ...prev,
          cabezasDisponibles: machineConfig.suggestedHeads,
        }))
      }
    }
  }

  const handleClear = () => {
    setFormData({
      employeeId: '',
      colegio: '',
      machine: '',
      date: new Date().toISOString().split('T')[0],
      prenda: '',
      apliques: 0,
      cantidad: 0,
      cabezasDisponibles: 0,
      puntadasBordado: 0,
      horaInicio: '08:00',
      horaFin: '17:00',
    })
    if (editingRecord) {
      onCancelEdit()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.employeeId || !formData.machine || !formData.date) {
      return
    }

    const record: ProductionRecord = {
      id: editingRecord?.id || generateId(),
      employeeId: formData.employeeId,
      colegio: formData.colegio,
      machine: formData.machine as MachineType,
      date: formData.date,
      prenda: formData.prenda,
      apliques: formData.apliques,
      cantidad: formData.cantidad,
      cabezasDisponibles: formData.cabezasDisponibles,
      puntadasBordado: formData.puntadasBordado,
      horaInicio: formData.horaInicio,
      horaFin: formData.horaFin,
      createdAt: editingRecord?.createdAt || new Date().toISOString(),
    }

    onSave(record)
    handleClear()
  }

  const isValid = formData.employeeId && formData.machine && formData.date && formData.cantidad > 0

  // Check for overlapping records
  const overlappingRecords = useMemo(() => {
    if (!formData.employeeId || !formData.date || !formData.horaInicio || !formData.horaFin) {
      return []
    }

    return records.filter(record => {
      // Skip the record being edited
      if (editingRecord && record.id === editingRecord.id) {
        return false
      }
      // Check same employee and same date
      if (record.employeeId !== formData.employeeId || record.date !== formData.date) {
        return false
      }
      // Check time overlap
      return timeRangesOverlap(
        formData.horaInicio,
        formData.horaFin,
        record.horaInicio,
        record.horaFin
      )
    })
  }, [formData.employeeId, formData.date, formData.horaInicio, formData.horaFin, records, editingRecord])

  const selectedEmployeeName = useMemo(() => {
    return employees.find(e => e.id === formData.employeeId)?.name || ''
  }, [formData.employeeId, employees])

  // Check for overlapping machine records (same machine, same date, overlapping time)
  const overlappingMachineRecords = useMemo(() => {
    if (!formData.machine || !formData.date || !formData.horaInicio || !formData.horaFin) {
      return []
    }

    return records.filter(record => {
      // Skip the record being edited
      if (editingRecord && record.id === editingRecord.id) {
        return false
      }
      // Check same machine and same date
      if (record.machine !== formData.machine || record.date !== formData.date) {
        return false
      }
      // Check time overlap
      return timeRangesOverlap(
        formData.horaInicio,
        formData.horaFin,
        record.horaInicio,
        record.horaFin
      )
    })
  }, [formData.machine, formData.date, formData.horaInicio, formData.horaFin, records, editingRecord])

  // Get operator names for machine conflict
  const getMachineConflictOperatorName = (empId: string) => {
    return employees.find(e => e.id === empId)?.name || 'Desconocido'
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg text-card-foreground">
          <span className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            {editingRecord ? 'Editando Registro' : 'Nuevo Registro de Producción'}
          </span>
          {editingRecord && (
            <Button variant="ghost" size="sm" onClick={onCancelEdit} className="text-muted-foreground">
              <X className="h-4 w-4 mr-1" />
              Cancelar edición
            </Button>
          )}
        </CardTitle>
        {editingRecord && (
          <p className="text-sm text-warning">
            Modificando registro existente. Los cambios se guardarán sobre el registro original.
          </p>
        )}
      </CardHeader>
      <CardContent>
        {/* Alert for overlapping machine time */}
        {overlappingMachineRecords.length > 0 && (
          <Alert variant="destructive" className="mb-6 border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="font-semibold">
              Conflicto de máquina detectado
            </AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-2">
                La máquina <strong>{formData.machine}</strong> ya tiene {overlappingMachineRecords.length === 1 ? 'un registro' : `${overlappingMachineRecords.length} registros`} en el horario seleccionado para la fecha <strong>{formData.date}</strong>:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {overlappingMachineRecords.map(record => (
                  <li key={record.id}>
                    {record.horaInicio} - {record.horaFin} - Operario: <strong>{getMachineConflictOperatorName(record.employeeId)}</strong> ({record.prenda || record.colegio || 'Sin descripción'})
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm italic text-destructive-foreground">
                Una máquina no puede realizar dos trabajos al mismo tiempo. Por favor, ajusta el horario.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Alert for overlapping operator time */}
        {overlappingRecords.length > 0 && (
          <Alert variant="destructive" className="mb-6 border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="font-semibold">
              Conflicto de horario de operario
            </AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-2">
                El operario <strong>{selectedEmployeeName}</strong> ya tiene {overlappingRecords.length === 1 ? 'un registro' : `${overlappingRecords.length} registros`} en el horario seleccionado para la fecha <strong>{formData.date}</strong>:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {overlappingRecords.map(record => (
                  <li key={record.id}>
                    {record.horaInicio} - {record.horaFin} ({record.prenda || record.colegio || 'Sin descripción'})
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm italic">
                Puedes continuar guardando si lo deseas, pero verifica que el horario sea correcto.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Operario */}
            <div className="space-y-2">
              <Label htmlFor="operario" className="text-foreground">Operario *</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
              >
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Seleccionar operario" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {activeEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id} className="text-popover-foreground">
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Colegio */}
            <div className="space-y-2">
              <Label htmlFor="colegio" className="text-foreground">Colegio</Label>
              <Input
                id="colegio"
                value={formData.colegio}
                onChange={(e) => setFormData(prev => ({ ...prev, colegio: e.target.value }))}
                placeholder="Nombre del colegio"
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Máquina */}
            <div className="space-y-2">
              <Label htmlFor="machine" className="text-foreground">Máquina *</Label>
              <Select
                value={formData.machine}
                onValueChange={(value) => handleMachineChange(value as MachineType)}
              >
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Seleccionar máquina" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {MACHINES.map((machine) => (
                    <SelectItem key={machine.type} value={machine.type} className="text-popover-foreground">
                      {machine.type} ({machine.suggestedHeads} cabezas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-foreground">Fecha *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="bg-input border-border text-foreground"
              />
            </div>

            {/* Prenda */}
            <div className="space-y-2">
              <Label htmlFor="prenda" className="text-foreground">Prenda</Label>
              <Input
                id="prenda"
                value={formData.prenda}
                onChange={(e) => setFormData(prev => ({ ...prev, prenda: e.target.value }))}
                placeholder="Tipo de prenda"
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Apliques */}
            <div className="space-y-2">
              <Label htmlFor="apliques" className="text-foreground">Apliques</Label>
              <Input
                id="apliques"
                type="number"
                min="0"
                value={formData.apliques}
                onChange={(e) => setFormData(prev => ({ ...prev, apliques: parseInt(e.target.value) || 0 }))}
                className="bg-input border-border text-foreground"
              />
            </div>

            {/* Cantidad */}
            <div className="space-y-2">
              <Label htmlFor="cantidad" className="text-foreground">Cantidad que se hizo *</Label>
              <Input
                id="cantidad"
                type="number"
                min="0"
                value={formData.cantidad || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                className="bg-input border-border text-foreground"
              />
            </div>

            {/* Cabezas disponibles */}
            <div className="space-y-2">
              <Label htmlFor="cabezas" className="text-foreground">Cabezas disponibles</Label>
              <div className="flex gap-2">
                <Input
                  id="cabezas"
                  type="number"
                  min="1"
                  value={formData.cabezasDisponibles || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, cabezasDisponibles: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  className="bg-input border-border text-foreground"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleUseSuggestedHeads}
                  disabled={!formData.machine}
                  title="Usar cabezas sugeridas"
                  className="border-border text-muted-foreground hover:text-primary hover:border-primary"
                >
                  <Lightbulb className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Puntadas de bordado */}
            <div className="space-y-2">
              <Label htmlFor="puntadas" className="text-foreground">Puntadas de bordado</Label>
              <Input
                id="puntadas"
                type="number"
                min="0"
                value={formData.puntadasBordado || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, puntadasBordado: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                className="bg-input border-border text-foreground"
              />
            </div>

            {/* Hora inicio */}
            <div className="space-y-2">
              <Label htmlFor="horaInicio" className="text-foreground">Hora inicio</Label>
              <Input
                id="horaInicio"
                type="time"
                value={formData.horaInicio}
                onChange={(e) => setFormData(prev => ({ ...prev, horaInicio: e.target.value }))}
                className="bg-input border-border text-foreground"
              />
            </div>

            {/* Hora fin */}
            <div className="space-y-2">
              <Label htmlFor="horaFin" className="text-foreground">Hora fin</Label>
              <Input
                id="horaFin"
                type="time"
                value={formData.horaFin}
                onChange={(e) => setFormData(prev => ({ ...prev, horaFin: e.target.value }))}
                className="bg-input border-border text-foreground"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
            <Button type="submit" disabled={!isValid}>
              <Save className="h-4 w-4 mr-2" />
              {editingRecord ? 'Guardar cambios' : 'Guardar registro'}
            </Button>
            <Button type="button" variant="outline" onClick={handleClear} className="border-border">
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpiar formulario
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
