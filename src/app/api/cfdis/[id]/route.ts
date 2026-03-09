import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const cfdi = await prisma.cfdi.findUnique({
    where: { id },
    include: {
      emisor: { select: { rfc: true, razonSocial: true, regimenFiscal: true } },
      receptor: { select: { rfc: true, razonSocial: true } },
      conceptos: true,
      createdBy: { select: { name: true } },
    },
  })

  if (!cfdi) return NextResponse.json({ error: 'CFDI no encontrado' }, { status: 404 })

  return NextResponse.json(cfdi)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const cfdi = await prisma.cfdi.findUnique({ where: { id } })
  if (!cfdi) return NextResponse.json({ error: 'CFDI no encontrado' }, { status: 404 })
  if (cfdi.status !== 'PENDIENTE') {
    return NextResponse.json({ error: 'Solo se pueden eliminar CFDIs pendientes' }, { status: 400 })
  }

  await prisma.cfdi.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
