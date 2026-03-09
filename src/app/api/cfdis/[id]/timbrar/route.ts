import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { timbrar } from '@/lib/pac/client'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const cfdi = await prisma.cfdi.findUnique({
    where: { id },
    include: { emisor: true, receptor: true, conceptos: true },
  })

  if (!cfdi) return NextResponse.json({ error: 'CFDI no encontrado' }, { status: 404 })
  if (cfdi.status !== 'PENDIENTE') {
    return NextResponse.json({ error: 'Solo se pueden timbrar CFDIs pendientes' }, { status: 400 })
  }

  try {
    const xmlPrevio = `<serie>${cfdi.serie}</serie><total>${cfdi.total}</total>`
    const resultado = await timbrar(xmlPrevio)

    const updated = await prisma.cfdi.update({
      where: { id },
      data: {
        status: 'TIMBRADO',
        uuid: resultado.uuid,
        fechaTimbrado: new Date(resultado.fechaTimbrado),
        selloCFD: resultado.selloCFD,
        selloSAT: resultado.selloSAT,
        noCertificadoSAT: resultado.noCertificadoSAT,
        cadenaOriginal: resultado.cadenaOriginal,
        xmlTimbrado: resultado.xmlTimbrado,
      },
    })

    return NextResponse.json(updated)
  } catch {
    await prisma.cfdi.update({
      where: { id },
      data: { status: 'ERROR' },
    })
    return NextResponse.json({ error: 'Error al timbrar el CFDI' }, { status: 500 })
  }
}
