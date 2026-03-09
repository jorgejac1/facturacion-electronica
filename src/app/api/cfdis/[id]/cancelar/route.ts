import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { cancelar } from '@/lib/pac/client'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const cfdi = await prisma.cfdi.findUnique({
    where: { id },
    include: { emisor: true },
  })

  if (!cfdi) return NextResponse.json({ error: 'CFDI no encontrado' }, { status: 404 })
  if (cfdi.status !== 'TIMBRADO') {
    return NextResponse.json({ error: 'Solo se pueden cancelar CFDIs timbrados' }, { status: 400 })
  }
  if (!cfdi.uuid) {
    return NextResponse.json({ error: 'CFDI sin UUID' }, { status: 400 })
  }

  try {
    const resultado = await cancelar(
      cfdi.uuid,
      cfdi.emisor.rfc,
      body.motivo,
      body.folioSustitucion
    )

    const updated = await prisma.cfdi.update({
      where: { id },
      data: {
        status: 'CANCELADO',
        fechaCancelacion: new Date(resultado.fechaCancelacion),
        motivoCancelacion: body.motivo,
        folioSustitucion: body.folioSustitucion,
      },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Error al cancelar el CFDI' }, { status: 500 })
  }
}
