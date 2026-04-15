'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Activity, FileText, Clock, TrendingUp, Package } from 'lucide-react'
import type { ProductionRecord } from '@/lib/types'
import { calculateMetrics, formatNumber } from '@/lib/calculations'

interface SummaryCardsProps {
  records: ProductionRecord[]
}

export function SummaryCards({ records }: SummaryCardsProps) {
  let totalPuntadas = 0
  let totalCantidad = 0
  let totalMinutosPega = 0
  let sumRendimiento = 0
  let rendimientoCount = 0

  records.forEach(record => {
    const metrics = calculateMetrics(record)
    totalPuntadas += metrics.totalPuntadas
    totalCantidad += record.cantidad
    totalMinutosPega += metrics.minutosEnPegaApliques
    if (metrics.puntadasPorMinutoPorCabezaDescontandoPega > 0) {
      sumRendimiento += metrics.puntadasPorMinutoPorCabezaDescontandoPega
      rendimientoCount++
    }
  })

  const promedioRendimiento = rendimientoCount > 0 ? sumRendimiento / rendimientoCount : 0

  const cards = [
    {
      title: 'Total Registros',
      value: records.length.toLocaleString('es-CO'),
      icon: FileText,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
    },
    {
      title: 'Total Cantidad',
      value: totalCantidad.toLocaleString('es-CO'),
      icon: Package,
      color: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
    },
    {
      title: 'Total Puntadas',
      value: formatNumber(totalPuntadas, 0),
      icon: Activity,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Minutos en Pega',
      value: formatNumber(totalMinutosPega, 1),
      icon: Clock,
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
    },
    {
      title: 'Prom. Rendimiento',
      value: formatNumber(promedioRendimiento, 2),
      subtitle: 'punt/min/cabeza',
      icon: TrendingUp,
      color: 'text-chart-1',
      bgColor: 'bg-chart-1/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-card-foreground">
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                )}
              </div>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
