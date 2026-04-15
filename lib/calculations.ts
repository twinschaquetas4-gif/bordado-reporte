import type { ProductionRecord, CalculatedMetrics, DailySummary, WeeklySummary, Employee, EmployeeSummary } from './types'

export function calculateMetrics(record: ProductionRecord): CalculatedMetrics {
  // 1. Total puntadas = cantidad que se hizo × puntadas de bordado
  const totalPuntadas = record.cantidad * record.puntadasBordado

  // 2. Tandas = redondear hacia arriba(cantidad que se hizo / cabezas disponibles)
  const tandas = record.cabezasDisponibles > 0 
    ? Math.ceil(record.cantidad / record.cabezasDisponibles) 
    : 0

  // Calculate hours - handle overnight shifts
  const [startHour, startMin] = record.horaInicio.split(':').map(Number)
  const [endHour, endMin] = record.horaFin.split(':').map(Number)
  
  let startMinutes = startHour * 60 + startMin
  let endMinutes = endHour * 60 + endMin
  
  // If end time is less than start time, assume it's the next day
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60
  }
  
  // 3. Horas = diferencia entre hora inicio y hora fin
  const minutos = endMinutes - startMinutes
  const horas = minutos / 60

  // 4. Minutos = horas × 60 (already calculated above)

  // 5. Puntadas por minuto = total puntadas / minutos
  const puntadasPorMinuto = minutos > 0 ? totalPuntadas / minutos : 0

  // 6. Puntadas por minuto por cabeza = puntadas por minuto / cabezas disponibles
  const puntadasPorMinutoPorCabeza = record.cabezasDisponibles > 0 
    ? puntadasPorMinuto / record.cabezasDisponibles 
    : 0

  // 7. Minutos en pega de apliques = apliques × 0.5 × cantidad que se hizo
  const minutosEnPegaApliques = record.apliques * 0.5 * record.cantidad

  // 8. Puntadas por minuto por cabeza descontando el tiempo de pega de apliques
  const minutosEfectivos = minutos - minutosEnPegaApliques
  const puntadasPorMinutoPorCabezaDescontandoPega = 
    minutosEfectivos > 0 && record.cabezasDisponibles > 0
      ? (totalPuntadas / minutosEfectivos) / record.cabezasDisponibles
      : 0

  return {
    totalPuntadas,
    tandas,
    horas,
    minutos,
    puntadasPorMinuto,
    puntadasPorMinutoPorCabeza,
    minutosEnPegaApliques,
    puntadasPorMinutoPorCabezaDescontandoPega,
  }
}

export function getWeekNumber(dateStr: string): number {
  const date = new Date(dateStr)
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

export function getWeekLabel(dateStr: string): string {
  const weekNum = getWeekNumber(dateStr)
  const year = new Date(dateStr).getFullYear()
  return `Semana ${weekNum} - ${year}`
}

export function getWeekRange(dateStr: string): { start: Date; end: Date } {
  const date = new Date(dateStr)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const start = new Date(date.setDate(diff))
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start, end }
}

export function groupRecordsByEmployeeAndDay(
  records: ProductionRecord[],
  employees: Employee[]
): EmployeeSummary[] {
  const employeeMap = new Map(employees.map(e => [e.id, e]))
  const grouped: Map<string, Map<string, ProductionRecord[]>> = new Map()

  records.forEach(record => {
    if (!grouped.has(record.employeeId)) {
      grouped.set(record.employeeId, new Map())
    }
    const employeeRecords = grouped.get(record.employeeId)!
    if (!employeeRecords.has(record.date)) {
      employeeRecords.set(record.date, [])
    }
    employeeRecords.get(record.date)!.push(record)
  })

  const summaries: EmployeeSummary[] = []

  grouped.forEach((dayRecords, employeeId) => {
    const employee = employeeMap.get(employeeId)
    if (!employee) return

    const dailySummaries: DailySummary[] = []
    let totalRecords = 0
    let totalCantidad = 0
    let totalPuntadas = 0
    let totalMinutosPega = 0
    let sumRendimiento = 0
    let rendimientoCount = 0

    const sortedDates = Array.from(dayRecords.keys()).sort((a, b) => b.localeCompare(a))
    
    sortedDates.forEach(date => {
      const dayRecordsList = dayRecords.get(date)!
      let dayCantidad = 0
      let dayPuntadas = 0
      let dayMinutosPega = 0
      let dayRendimiento = 0
      let dayRendimientoCount = 0

      dayRecordsList.forEach(record => {
        const metrics = calculateMetrics(record)
        dayCantidad += record.cantidad
        dayPuntadas += metrics.totalPuntadas
        dayMinutosPega += metrics.minutosEnPegaApliques
        if (metrics.puntadasPorMinutoPorCabezaDescontandoPega > 0) {
          dayRendimiento += metrics.puntadasPorMinutoPorCabezaDescontandoPega
          dayRendimientoCount++
        }
      })

      totalRecords += dayRecordsList.length
      totalCantidad += dayCantidad
      totalPuntadas += dayPuntadas
      totalMinutosPega += dayMinutosPega
      sumRendimiento += dayRendimiento
      rendimientoCount += dayRendimientoCount

      dailySummaries.push({
        date,
        records: dayRecordsList,
        totalCantidad: dayCantidad,
        totalPuntadas: dayPuntadas,
        totalMinutosPega: dayMinutosPega,
        promedioRendimiento: dayRendimientoCount > 0 ? dayRendimiento / dayRendimientoCount : 0,
      })
    })

    summaries.push({
      employee,
      dailySummaries,
      totalRecords,
      totalCantidad,
      totalPuntadas,
      totalMinutosPega,
      promedioRendimiento: rendimientoCount > 0 ? sumRendimiento / rendimientoCount : 0,
    })
  })

  return summaries.sort((a, b) => a.employee.name.localeCompare(b.employee.name))
}

export function groupRecordsByWeek(records: ProductionRecord[]): WeeklySummary[] {
  const weekMap: Map<string, ProductionRecord[]> = new Map()

  records.forEach(record => {
    const weekLabel = getWeekLabel(record.date)
    if (!weekMap.has(weekLabel)) {
      weekMap.set(weekLabel, [])
    }
    weekMap.get(weekLabel)!.push(record)
  })

  const summaries: WeeklySummary[] = []

  weekMap.forEach((weekRecords, weekLabel) => {
    let totalCantidad = 0
    let totalPuntadas = 0
    let totalMinutosPega = 0
    let sumRendimiento = 0
    let rendimientoCount = 0

    const sortedRecords = weekRecords.sort((a, b) => a.date.localeCompare(b.date))
    const firstRecord = sortedRecords[0]
    const weekRange = getWeekRange(firstRecord.date)

    weekRecords.forEach(record => {
      const metrics = calculateMetrics(record)
      totalCantidad += record.cantidad
      totalPuntadas += metrics.totalPuntadas
      totalMinutosPega += metrics.minutosEnPegaApliques
      if (metrics.puntadasPorMinutoPorCabezaDescontandoPega > 0) {
        sumRendimiento += metrics.puntadasPorMinutoPorCabezaDescontandoPega
        rendimientoCount++
      }
    })

    summaries.push({
      weekNumber: getWeekNumber(firstRecord.date),
      weekLabel,
      startDate: weekRange.start.toISOString().split('T')[0],
      endDate: weekRange.end.toISOString().split('T')[0],
      records: weekRecords,
      totalCantidad,
      totalPuntadas,
      totalMinutosPega,
      promedioRendimiento: rendimientoCount > 0 ? sumRendimiento / rendimientoCount : 0,
    })
  })

  return summaries.sort((a, b) => b.weekNumber - a.weekNumber)
}

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('es-CO', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  })
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('es-CO', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
