'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import type { Employee, ProductionRecord } from '@/lib/types'
import { calculateMetrics, getWeekLabel, formatNumber } from '@/lib/calculations'

interface ProductionChartsProps {
  employees: Employee[]
  records: ProductionRecord[]
  selectedEmployee: string | null
  selectedWeek: string | null
}

export function ProductionCharts({
  employees,
  records,
  selectedEmployee,
  selectedWeek,
}: ProductionChartsProps) {
  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees])

  // Filter records based on selection
  const filteredRecords = useMemo(() => {
    let result = records
    if (selectedEmployee) {
      result = result.filter(r => r.employeeId === selectedEmployee)
    }
    if (selectedWeek) {
      result = result.filter(r => getWeekLabel(r.date) === selectedWeek)
    }
    return result
  }, [records, selectedEmployee, selectedWeek])

  // A. Daily comparison for each employee
  const dailyByEmployee = useMemo(() => {
    const data: Record<string, { date: string; rendimiento: number; puntadas: number; cantidad: number }[]> = {}
    
    const employeeIds = selectedEmployee ? [selectedEmployee] : [...new Set(records.map(r => r.employeeId))]
    
    employeeIds.forEach(empId => {
      const empRecords = filteredRecords.filter(r => r.employeeId === empId)
      const byDate: Record<string, { rendimientos: number[]; puntadas: number; cantidad: number }> = {}
      
      empRecords.forEach(record => {
        if (!byDate[record.date]) {
          byDate[record.date] = { rendimientos: [], puntadas: 0, cantidad: 0 }
        }
        const metrics = calculateMetrics(record)
        if (metrics.puntadasPorMinutoPorCabezaDescontandoPega > 0) {
          byDate[record.date].rendimientos.push(metrics.puntadasPorMinutoPorCabezaDescontandoPega)
        }
        byDate[record.date].puntadas += metrics.totalPuntadas
        byDate[record.date].cantidad += record.cantidad
      })
      
      data[empId] = Object.entries(byDate)
        .map(([date, values]) => ({
          date,
          rendimiento: values.rendimientos.length > 0 
            ? values.rendimientos.reduce((a, b) => a + b, 0) / values.rendimientos.length 
            : 0,
          puntadas: values.puntadas,
          cantidad: values.cantidad,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    })
    
    return data
  }, [filteredRecords, selectedEmployee, records])

  // B. Weekly comparison for each employee
  const weeklyByEmployee = useMemo(() => {
    const data: Record<string, { week: string; rendimiento: number; puntadas: number; cantidad: number }[]> = {}
    
    const employeeIds = selectedEmployee ? [selectedEmployee] : [...new Set(records.map(r => r.employeeId))]
    
    employeeIds.forEach(empId => {
      const empRecords = records.filter(r => r.employeeId === empId)
      const byWeek: Record<string, { rendimientos: number[]; puntadas: number; cantidad: number }> = {}
      
      empRecords.forEach(record => {
        const week = getWeekLabel(record.date)
        if (!byWeek[week]) {
          byWeek[week] = { rendimientos: [], puntadas: 0, cantidad: 0 }
        }
        const metrics = calculateMetrics(record)
        if (metrics.puntadasPorMinutoPorCabezaDescontandoPega > 0) {
          byWeek[week].rendimientos.push(metrics.puntadasPorMinutoPorCabezaDescontandoPega)
        }
        byWeek[week].puntadas += metrics.totalPuntadas
        byWeek[week].cantidad += record.cantidad
      })
      
      data[empId] = Object.entries(byWeek)
        .map(([week, values]) => ({
          week,
          rendimiento: values.rendimientos.length > 0 
            ? values.rendimientos.reduce((a, b) => a + b, 0) / values.rendimientos.length 
            : 0,
          puntadas: values.puntadas,
          cantidad: values.cantidad,
        }))
        .sort((a, b) => a.week.localeCompare(b.week))
    })
    
    return data
  }, [records, selectedEmployee])

  // C. Comparison between employees
  const employeeComparison = useMemo(() => {
    const byEmployee: Record<string, { rendimientos: number[]; puntadas: number; cantidad: number; minutosTrabajados: number; registros: number }> = {}
    
    filteredRecords.forEach(record => {
      if (!byEmployee[record.employeeId]) {
        byEmployee[record.employeeId] = { rendimientos: [], puntadas: 0, cantidad: 0, minutosTrabajados: 0, registros: 0 }
      }
      const metrics = calculateMetrics(record)
      if (metrics.puntadasPorMinutoPorCabezaDescontandoPega > 0) {
        byEmployee[record.employeeId].rendimientos.push(metrics.puntadasPorMinutoPorCabezaDescontandoPega)
      }
      byEmployee[record.employeeId].puntadas += metrics.totalPuntadas
      byEmployee[record.employeeId].cantidad += record.cantidad
      byEmployee[record.employeeId].minutosTrabajados += metrics.minutosTrabajados
      byEmployee[record.employeeId].registros += 1
    })
    
    return Object.entries(byEmployee).map(([empId, values]) => ({
      name: employeeMap.get(empId)?.name || 'Desconocido',
      rendimiento: values.rendimientos.length > 0 
        ? values.rendimientos.reduce((a, b) => a + b, 0) / values.rendimientos.length 
        : 0,
      puntadas: values.puntadas,
      cantidad: values.cantidad,
      horasTrabajadas: Math.round(values.minutosTrabajados / 60 * 100) / 100,
      registros: values.registros,
      puntadasPromedio: values.registros > 0 ? Math.round(values.puntadas / values.registros) : 0,
    }))
  }, [filteredRecords, employeeMap])

  // D. Full comparison - all metrics in one chart
  const fullComparison = useMemo(() => {
    return employeeComparison.map(emp => ({
      ...emp,
      // Normalize values for radar chart (0-100 scale)
      rendimientoNorm: Math.min(100, emp.rendimiento * 10),
      puntadasNorm: Math.min(100, (emp.puntadas / Math.max(...employeeComparison.map(e => e.puntadas || 1))) * 100),
      cantidadNorm: Math.min(100, (emp.cantidad / Math.max(...employeeComparison.map(e => e.cantidad || 1))) * 100),
      horasNorm: Math.min(100, (emp.horasTrabajadas / Math.max(...employeeComparison.map(e => e.horasTrabajadas || 1))) * 100),
    }))
  }, [employeeComparison])

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatNumber(entry.value, 2)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (records.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Gráficas Comparativas</h2>

      {/* MAIN: Full comparison of all operators */}
      {employeeComparison.length > 1 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground">
              Comparativa General de Operarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={fullComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="rendimiento" fill="hsl(var(--chart-1))" name="Rendimiento (p/m/c)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="horasTrabajadas" fill="hsl(var(--chart-2))" name="Horas Trabajadas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="registros" fill="hsl(var(--chart-3))" name="Num. Registros" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Comparison table */}
      {employeeComparison.length > 0 && (
        <Card className="border-border bg-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground">
              Tabla Comparativa de Operarios
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Operario</th>
                    <th className="text-right p-3 font-semibold text-foreground">Registros</th>
                    <th className="text-right p-3 font-semibold text-foreground">Total Cantidad</th>
                    <th className="text-right p-3 font-semibold text-foreground">Total Puntadas</th>
                    <th className="text-right p-3 font-semibold text-foreground">Horas Trabajadas</th>
                    <th className="text-right p-3 font-semibold text-foreground">Rendimiento Prom.</th>
                    <th className="text-right p-3 font-semibold text-foreground">Puntadas/Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeComparison
                    .sort((a, b) => b.rendimiento - a.rendimiento)
                    .map((emp, idx) => (
                    <tr key={emp.name} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="p-3 font-medium text-foreground">{emp.name}</td>
                      <td className="p-3 text-right text-muted-foreground">{emp.registros}</td>
                      <td className="p-3 text-right text-muted-foreground">{formatNumber(emp.cantidad)}</td>
                      <td className="p-3 text-right text-muted-foreground">{formatNumber(emp.puntadas)}</td>
                      <td className="p-3 text-right text-muted-foreground">{formatNumber(emp.horasTrabajadas, 1)}h</td>
                      <td className="p-3 text-right font-semibold text-primary">{formatNumber(emp.rendimiento, 2)}</td>
                      <td className="p-3 text-right text-muted-foreground">{formatNumber(emp.puntadasPromedio)}</td>
                    </tr>
                  ))}
                </tbody>
                {employeeComparison.length > 1 && (
                  <tfoot className="bg-muted/50 font-semibold">
                    <tr>
                      <td className="p-3 text-foreground">TOTAL</td>
                      <td className="p-3 text-right text-foreground">{employeeComparison.reduce((sum, e) => sum + e.registros, 0)}</td>
                      <td className="p-3 text-right text-foreground">{formatNumber(employeeComparison.reduce((sum, e) => sum + e.cantidad, 0))}</td>
                      <td className="p-3 text-right text-foreground">{formatNumber(employeeComparison.reduce((sum, e) => sum + e.puntadas, 0))}</td>
                      <td className="p-3 text-right text-foreground">{formatNumber(employeeComparison.reduce((sum, e) => sum + e.horasTrabajadas, 0), 1)}h</td>
                      <td className="p-3 text-right text-primary">
                        {formatNumber(
                          employeeComparison.reduce((sum, e) => sum + e.rendimiento, 0) / employeeComparison.length,
                          2
                        )}
                      </td>
                      <td className="p-3 text-right text-foreground">-</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee comparison charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rendimiento by employee */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base text-card-foreground">
              Rendimiento por Operario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeeComparison} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rendimiento" fill="hsl(var(--chart-1))" name="Rendimiento (p/m/c)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Total puntadas by employee */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base text-card-foreground">
              Total Puntadas por Operario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeeComparison} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="puntadas" fill="hsl(var(--chart-2))" name="Total Puntadas" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Total cantidad by employee */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base text-card-foreground">
              Total Cantidad por Operario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeeComparison} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cantidad" fill="hsl(var(--chart-3))" name="Total Cantidad" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Individual employee daily/weekly trends */}
      {Object.entries(dailyByEmployee).map(([empId, data]) => {
        const employee = employeeMap.get(empId)
        if (!employee || data.length === 0) return null
        
        const weeklyData = weeklyByEmployee[empId] || []

        return (
          <div key={empId} className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">
              Tendencias de {employee.name}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily trend */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base text-card-foreground">
                    Rendimiento por Día
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        tickFormatter={(value) => value.slice(5)}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="rendimiento" 
                        stroke="hsl(var(--chart-1))" 
                        name="Rendimiento"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--chart-1))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Weekly trend */}
              {weeklyData.length > 0 && (
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-base text-card-foreground">
                      Rendimiento por Semana
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="week" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={10}
                          tickFormatter={(value) => value.replace('Semana ', 'S')}
                        />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar 
                          dataKey="rendimiento" 
                          fill="hsl(var(--chart-1))" 
                          name="Rendimiento"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
