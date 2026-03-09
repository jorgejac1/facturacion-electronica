import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalCfdis,
    timbrados,
    cancelados,
    pendientes,
    errores,
    montoMes,
    timbresConsumidosMes,
    incidentesAbiertos,
    totalIncidents,
    slaCumplidos,
    actividadReciente,
  ] = await Promise.all([
    prisma.cfdi.count(),
    prisma.cfdi.count({ where: { status: 'TIMBRADO' } }),
    prisma.cfdi.count({ where: { status: 'CANCELADO' } }),
    prisma.cfdi.count({ where: { status: 'PENDIENTE' } }),
    prisma.cfdi.count({ where: { status: 'ERROR' } }),
    prisma.cfdi.aggregate({
      where: { status: 'TIMBRADO', fechaTimbrado: { gte: startOfMonth } },
      _sum: { total: true },
    }),
    prisma.cfdi.count({
      where: { status: 'TIMBRADO', fechaTimbrado: { gte: startOfMonth } },
    }),
    prisma.incident.count({
      where: { status: { in: ['ABIERTO', 'EN_ATENCION'] } },
    }),
    prisma.incident.count({ where: { cumpleSLA: { not: null } } }),
    prisma.incident.count({ where: { cumpleSLA: true } }),
    prisma.cfdi.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        emisor: { select: { rfc: true } },
        receptor: { select: { rfc: true } },
      },
    }),
  ])

  const cumplimientoSLA = totalIncidents > 0
    ? Math.round((slaCumplidos / totalIncidents) * 100)
    : 100

  return NextResponse.json({
    totalCfdis,
    timbrados,
    cancelados,
    pendientes,
    errores,
    montoTotalMes: montoMes._sum.total || 0,
    timbresConsumidosMes,
    timbresDisponibles: 4_000_000 - timbresConsumidosMes,
    cumplimientoSLA,
    incidentesAbiertos,
    actividadReciente: actividadReciente.map((c: typeof actividadReciente[number]) => ({
      id: c.id,
      tipo: c.tipo,
      descripcion: `${c.emisor.rfc} → ${c.receptor.rfc}`,
      fecha: c.createdAt.toISOString(),
      status: c.status,
    })),
  })
}
