'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Calendar, TrendingUp } from 'lucide-react'
import type { ProductionRecord } from '@/lib/types'
import { groupRecordsByWeek, formatNumber, formatDate } from '@/lib/calculations'

interface WeeklyReportsProps {
  records: ProductionRecord[]
}

export function WeeklyReports({ records }: WeeklyReportsProps) {
  const weeklySummaries = useMemo(() => groupRecordsByWeek(records), [records])

  if (weeklySummaries.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" />
        Reportes por Semana
      </h2>

      <div className="grid gap-4">
        {weeklySummaries.map((week) => (
          <Card key={week.weekLabel} className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="border-primary text-primary">
                    {week.weekLabel}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(week.startDate)} - {formatDate(week.endDate)}
                  </span>
                </div>
                <Badge variant="secondary">
                  {week.records.length} registros
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Cantidad</p>
                  <p className="text-xl font-bold text-primary">{week.totalCantidad.toLocaleString('es-CO')}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Puntadas</p>
                  <p className="text-xl font-bold text-chart-2">{formatNumber(week.totalPuntadas, 0)}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Min. en Pega</p>
                  <p className="text-xl font-bold text-chart-4">{formatNumber(week.totalMinutosPega, 1)}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Prom. Rendimiento
                  </p>
                  <p className="text-xl font-bold text-chart-1">{formatNumber(week.promedioRendimiento, 2)}</p>
                </div>
              </div>

              <div className="overflow-x-auto border border-border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="text-muted-foreground">Fecha</TableHead>
                      <TableHead className="text-muted-foreground text-right">Registros</TableHead>
                      <TableHead className="text-muted-foreground text-right">Cantidad</TableHead>
                      <TableHead className="text-muted-foreground text-right">Puntadas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(
                      week.records.reduce((acc, record) => {
                        if (!acc[record.date]) {
                          acc[record.date] = { count: 0, cantidad: 0, puntadas: 0 }
                        }
                        acc[record.date].count++
                        acc[record.date].cantidad += record.cantidad
                        acc[record.date].puntadas += record.cantidad * record.puntadasBordado
                        return acc
                      }, {} as Record<string, { count: number; cantidad: number; puntadas: number }>)
                    )
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([date, data]) => (
                        <TableRow key={date} className="hover:bg-secondary/30 border-border">
                          <TableCell className="text-foreground">{formatDate(date)}</TableCell>
                          <TableCell className="text-foreground text-right">{data.count}</TableCell>
                          <TableCell className="text-primary text-right font-medium">
                            {data.cantidad.toLocaleString('es-CO')}
                          </TableCell>
                          <TableCell className="text-chart-2 text-right font-medium">
                            {formatNumber(data.puntadas, 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
