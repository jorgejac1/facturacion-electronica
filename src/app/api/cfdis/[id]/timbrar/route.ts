import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { timbrar } from '@/lib/pac/client'
import type { TimbradoRequest } from '@/lib/pac/types'

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
    // Armar request con datos completos del CFDI
    const request: TimbradoRequest = {
      emisor: {
        rfc: cfdi.emisor.rfc,
        razonSocial: cfdi.emisor.razonSocial,
        regimenFiscal: cfdi.emisor.regimenFiscal,
      },
      receptor: {
        rfc: cfdi.receptor.rfc,
        razonSocial: cfdi.receptor.razonSocial,
        regimenFiscal: cfdi.receptor.regimenFiscal,
        usoCfdi: cfdi.usoCfdi,
      },
      comprobante: {
        serie: cfdi.serie || undefined,
        folio: cfdi.folio || undefined,
        fecha: cfdi.fecha.toISOString(),
        tipo: cfdi.tipo,
        metodoPago: cfdi.metodoPago,
        formaPago: cfdi.formaPago,
        moneda: cfdi.moneda,
        tipoCambio: cfdi.tipoCambio,
        lugarExpedicion: cfdi.lugarExpedicion,
        subtotal: cfdi.subtotal,
        descuento: cfdi.descuento,
        totalImpuestos: cfdi.totalImpuestos,
        total: cfdi.total,
      },
      conceptos: cfdi.conceptos.map((c) => ({
        claveProdServ: c.claveProdServ,
        cantidad: c.cantidad,
        claveUnidad: c.claveUnidad,
        unidad: c.unidad || undefined,
        descripcion: c.descripcion,
        valorUnitario: c.valorUnitario,
        importe: c.importe,
        descuento: c.descuento,
        objetoImpuesto: c.objetoImpuesto,
        tasaIVA: c.tasaIVA ?? undefined,
        importeIVA: c.importeIVA ?? undefined,
      })),
    }

    const resultado = await timbrar(request)

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
