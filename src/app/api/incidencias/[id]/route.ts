import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// SLA limits in minutes
const SLA_LIMITS: Record<string, { atencion: number; resolucion: number }> = {
  ALTA: { atencion: 30, resolucion: 60 },
  MEDIA: { atencion: 120, resolucion: 240 },
  BAJA: { atencion: 300, resolucion: 600 },
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: { createdBy: { select: { name: true } } },
  })

  if (!incident) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(incident)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const incident = await prisma.incident.findUnique({ where: { id } })
  if (!incident) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const updateData: Record<string, unknown> = { ...body }
  const now = new Date()
  const slaLimits = SLA_LIMITS[incident.priority]

  // Track attention time
  if (body.status === 'EN_ATENCION' && !incident.fechaAtencion) {
    updateData.fechaAtencion = now
    const diffMinutes = Math.round(
      (now.getTime() - incident.fechaReporte.getTime()) / 60000
    )
    updateData.tiempoAtencionMinutos = diffMinutes
  }

  // Track resolution time and SLA compliance
  if (body.status === 'RESUELTO' && !incident.fechaResolucion) {
    updateData.fechaResolucion = now
    const diffMinutes = Math.round(
      (now.getTime() - incident.fechaReporte.getTime()) / 60000
    )
    updateData.tiempoResolucionMinutos = diffMinutes

    const atencionOk =
      (incident.tiempoAtencionMinutos ?? diffMinutes) <= slaLimits.atencion
    const resolucionOk = diffMinutes <= slaLimits.resolucion
    updateData.cumpleSLA = atencionOk && resolucionOk
  }

  const updated = await prisma.incident.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json(updated)
}
