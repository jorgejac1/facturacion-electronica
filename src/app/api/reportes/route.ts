import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const mes = searchParams.get('mes')
  const anio = searchParams.get('anio')
  const generate = searchParams.get('generate')

  // Generate report for specific month
  if (mes && anio && generate === 'true') {
    const mesNum = parseInt(mes)
    const anioNum = parseInt(anio)
    const startDate = new Date(anioNum, mesNum - 1, 1)
    const endDate = new Date(anioNum, mesNum, 1)

    const [timbrados, cancelados, errores, montoResult, incidentsAlta, incidentsMedia, incidentsBaja, totalIncidents, slaCumplidos] = await Promise.all([
      prisma.cfdi.count({ where: { status: 'TIMBRADO', fechaTimbrado: { gte: startDate, lt: endDate } } }),
      prisma.cfdi.count({ where: { status: 'CANCELADO', fechaCancelacion: { gte: startDate, lt: endDate } } }),
      prisma.cfdi.count({ where: { status: 'ERROR', createdAt: { gte: startDate, lt: endDate } } }),
      prisma.cfdi.aggregate({ where: { status: 'TIMBRADO', fechaTimbrado: { gte: startDate, lt: endDate } }, _sum: { total: true } }),
      prisma.incident.count({ where: { priority: 'ALTA', createdAt: { gte: startDate, lt: endDate } } }),
      prisma.incident.count({ where: { priority: 'MEDIA', createdAt: { gte: startDate, lt: endDate } } }),
      prisma.incident.count({ where: { priority: 'BAJA', createdAt: { gte: startDate, lt: endDate } } }),
      prisma.incident.count({ where: { createdAt: { gte: startDate, lt: endDate }, cumpleSLA: { not: null } } }),
      prisma.incident.count({ where: { createdAt: { gte: startDate, lt: endDate }, cumpleSLA: true } }),
    ])

    const cumplimientoSLA = totalIncidents > 0 ? Math.round((slaCumplidos / totalIncidents) * 100) : 100

    const reporte = await prisma.reporteMensual.upsert({
      where: { mes_anio: { mes: mesNum, anio: anioNum } },
      update: {
        totalTimbrados: timbrados,
        totalCancelados: cancelados,
        totalErrores: errores,
        montoTotal: montoResult._sum.total || 0,
        timbresConsumidos: timbrados,
        incidentesAlta: incidentsAlta,
        incidentesMedia: incidentsMedia,
        incidentesBaja: incidentsBaja,
        cumplimientoSLA,
        generadoEn: new Date(),
      },
      create: {
        mes: mesNum,
        anio: anioNum,
        totalTimbrados: timbrados,
        totalCancelados: cancelados,
        totalErrores: errores,
        montoTotal: montoResult._sum.total || 0,
        timbresConsumidos: timbrados,
        timbresDisponibles: 4_000_000 - timbrados,
        incidentesAlta: incidentsAlta,
        incidentesMedia: incidentsMedia,
        incidentesBaja: incidentsBaja,
        cumplimientoSLA,
      },
    })

    return NextResponse.json({ reporte })
  }

  // List all reports
  const limit = parseInt(searchParams.get('limit') || '12')
  const reportes = await prisma.reporteMensual.findMany({
    orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
    take: limit,
  })

  return NextResponse.json({ reportes })
}
